import { useEffect, useRef, useCallback } from 'react';
import { useServerStore } from './useServerStore';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { serverAPI, messageAPI } from '@shared/data';
import { Message, Server } from '@shared/types';
import { useServersQuery } from '../query/useServersQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useMessagesSocketBatch } from '../useMessagesSocketBatch';

// Global semaphore to deduplicate parallel fetches across hook instances
let globalLoadingServerId: string | null = null;

// Map clientNonce -> tempId to patch optimistic messages (shared with batching hook)
export const pendingMap: Record<string, string> = {};

// Hook that exposes the same API as old context but internally uses Zustand store
export const useServer = () => {
  // subscribe to each slice separately to keep referential stability
  const selectedServer = useServerStore((s) => s.selectedServer);
  const members = useServerStore((s) => s.members);
  const messages = useServerStore((s) => s.messages);
  const isLoadingStore = useServerStore((s) => s.isLoading);
  const areMembersLoading = useServerStore((s) => s.areMembersLoading);
  const errorStore = useServerStore((s) => s.error);
  const listeningStates = useServerStore((s) => s.listeningStates);

  // actions (stable references)
  const _setSelectedServer = useServerStore((s) => s.setSelectedServer);
  const setMembers = useServerStore((s) => s.setMembers);
  const setMessages = useServerStore((s) => s.setMessages);
  const setMembersLoading = useServerStore((s) => s.setMembersLoading);
  const addMessage = useServerStore((s) => s.addMessage);
  const updateMessage = useServerStore((s) => s.updateMessage);
  const removeMessage = useServerStore((s) => s.removeMessage);
  const setOptimisticMessageStatus = useServerStore((s) => s.setOptimisticMessageStatus);
  const addMessagesBatch = useServerStore((s) => s.addMessages);
  const setListeningState = useServerStore((s) => s.setListeningState);
  const setTransitioning = useServerStore((s) => s.setTransitioning);

  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Ref for selectedServer to avoid stale closures
  const selectedServerRef = useRef<Server | null>(null);
  // local flag syncs with global semaphore
  const loadingServerIdRef = useRef<string | null>(null);
  selectedServerRef.current = selectedServer;

  // React-Query: fetch servers once and deduplicate automatically
  const {
    data: serversQueryData,
    isLoading: serversQueryLoading,
    error: serversQueryError,
  } = useServersQuery();

  // restore last selected server once servers list loaded
  useEffect(() => {
    if (!serversQueryData) return;
    if (selectedServerRef.current) return;
    const saved = localStorage.getItem('lastSelectedServerId');
    if (saved) {
      const toSel = serversQueryData.find((s) => s.id === saved);
      if (toSel) selectServer(toSel);
    }
  }, [serversQueryData]);

  // derive loading / error from query
  const servers = serversQueryData ?? [];
  const setServers = (updater: Server[] | ((prev: Server[])=> Server[])) => {
    queryClient.setQueryData<Server[]>(['servers'], (old)=>{
      const prev = old ?? [];
      return typeof updater==='function' ? (updater as any)(prev) : updater;
    });
  };

  const isLoading = serversQueryLoading || isLoadingStore;
  const error = serversQueryError ? serversQueryError.message : errorStore;

  // selectServer logic (simplified from old context)
  const selectServer = useCallback(async (server: Server | null) => {
    if (server?.id === selectedServerRef.current?.id) return; // already selected
    if (server && (loadingServerIdRef.current === server.id || globalLoadingServerId === server.id)) return; // fetch in progress
    loadingServerIdRef.current = server ? server.id : null;
    setTransitioning(!!server);
    globalLoadingServerId = server ? server.id : null;
    if (socket) {
      if (selectedServerRef.current) {
        socket.emit('server:leave', selectedServerRef.current.id);
      }
      if (server) {
        socket.emit('server:join', server.id);
        localStorage.setItem('lastSelectedServerId', server.id);
      } else {
        localStorage.removeItem('lastSelectedServerId');
      }
    }
    _setSelectedServer(server);
    if (!server) {
      setMembers([]);
      setMessages([]);
      loadingServerIdRef.current = null;
      globalLoadingServerId = null;
      setTransitioning(false);
      return;
    }
    setMembersLoading(true);
    try {
      const [msgRes, memRes] = await Promise.all([
        messageAPI.getMessages(server.id),
        serverAPI.getServerMembers(server.id),
      ]);
      if (msgRes.success && msgRes.data) setMessages(msgRes.data);
      if (memRes.success && memRes.data) setMembers(memRes.data);
    } finally {
      setMembersLoading(false);
      loadingServerIdRef.current = null;
      globalLoadingServerId = null;
      setTransitioning(false);
    }
  }, [socket, _setSelectedServer, setMembers, setMessages, setMembersLoading, setTransitioning]);

  // clean up on logout
  useEffect(() => {
    if (!user) {
      selectServer(null);
    }
  }, [user]);

  // socket listeners except messages (handled by useMessagesSocketBatch)
  useEffect(() => {
    if (!socket) return;

    // no server listeners here

  }, [socket, setListeningState]);

  const sendMessage = useCallback((content: string) => {
    const server = selectedServer;
    if (!content.trim() || !server || !user || !socket) return;
    const clientNonce = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const tempId = `temp_${clientNonce}`;
    const optimistic: Message = {
      id: tempId,
      content,
      authorId: user.id,
      serverId: server.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      status: 'sending',
      clientNonce,
    } as Message & { status: 'sending' };
    addMessage(optimistic);
    pendingMap[clientNonce] = tempId;

    socket.emit('message:send', { serverId: server.id, content, clientNonce } as any, (response: any) => {
      if (!response) {
        setOptimisticMessageStatus(tempId, 'failed');
      }
      // ack handled via message:new
    });
  }, [socket, selectedServer, user, addMessage, updateMessage, setOptimisticMessageStatus, removeMessage]);

  const batchQueue: Message[] = [];
  let flushTimeout: any = null;
  const enqueue = (msg: Message)=>{
     batchQueue.push(msg);
     if(!flushTimeout){
        flushTimeout = setTimeout(()=>{
          addMessagesBatch(batchQueue.splice(0));
          flushTimeout=null;
        },50);
     }
  };

  // Handle 'message:*' socket events in a dedicated batching hook
  useMessagesSocketBatch(pendingMap);

  return {
    servers,
    selectedServer,
    members,
    messages,
    isLoading,
    areMembersLoading,
    error,
    selectServer,
    setServers,
    setMembers,
    fetchServers: () => {},
    sendMessage,
    listeningStates,
  };
}; 