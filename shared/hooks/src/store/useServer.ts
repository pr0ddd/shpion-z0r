import { useEffect, useRef, useCallback } from 'react';
import { useServerStore } from './useServerStore';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { serverAPI, messageAPI } from '@shared/data';
import { Message, Server } from '@shared/types';
import { useServersQuery } from '../query/useServersQuery';

// Global semaphore to deduplicate parallel fetches across hook instances
let globalLoadingServerId: string | null = null;

// Map clientNonce -> tempId to patch optimistic messages
const pendingMap: Record<string, string> = {};

// Hook that exposes the same API as old context but internally uses Zustand store
export const useServer = () => {
  // subscribe to each slice separately to keep referential stability
  const servers = useServerStore((s) => s.servers);
  const selectedServer = useServerStore((s) => s.selectedServer);
  const members = useServerStore((s) => s.members);
  const messages = useServerStore((s) => s.messages);
  const isLoadingStore = useServerStore((s) => s.isLoading);
  const areMembersLoading = useServerStore((s) => s.areMembersLoading);
  const errorStore = useServerStore((s) => s.error);
  const listeningStates = useServerStore((s) => s.listeningStates);

  // actions (stable references)
  const setServers = useServerStore((s) => s.setServers);
  const _setSelectedServer = useServerStore((s) => s.setSelectedServer);
  const setMembers = useServerStore((s) => s.setMembers);
  const setMessages = useServerStore((s) => s.setMessages);
  const setMembersLoading = useServerStore((s) => s.setMembersLoading);
  const addMessage = useServerStore((s) => s.addMessage);
  const updateMessage = useServerStore((s) => s.updateMessage);
  const removeMessage = useServerStore((s) => s.removeMessage);
  const setOptimisticMessageStatus = useServerStore((s) => s.setOptimisticMessageStatus);
  const isServersInitialized = useServerStore((s) => s.isServersInitialized);
  const setServersInitialized = useServerStore((s) => s.setServersInitialized);
  const addMessagesBatch = useServerStore((s) => s.addMessages);
  const setListeningState = useServerStore((s) => s.setListeningState);

  const { user } = useAuth();
  const { socket } = useSocket();

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

  // Sync react-query data into Zustand store
  useEffect(() => {
    if (serversQueryData) {
      setServers(serversQueryData);
      setServersInitialized(true);
      // restore last selected once
      if (!selectedServerRef.current) {
        const saved = localStorage.getItem('lastSelectedServerId');
        if (saved) {
          const toSel = serversQueryData.find((s) => s.id === saved);
          if (toSel) selectServer(toSel);
        }
      }
    }
  }, [serversQueryData]);

  // derive loading / error from query
  const isLoading = serversQueryLoading || isLoadingStore;
  const error = serversQueryError ? serversQueryError.message : errorStore;

  // selectServer logic (simplified from old context)
  const selectServer = useCallback(async (server: Server | null) => {
    if (server?.id === selectedServerRef.current?.id) return; // already selected
    if (server && (loadingServerIdRef.current === server.id || globalLoadingServerId === server.id)) return; // fetch in progress
    loadingServerIdRef.current = server ? server.id : null;
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
    }
  }, [socket, _setSelectedServer, setMembers, setMessages, setMembersLoading]);

  // clean up on logout
  useEffect(() => {
    if (!user) {
      setServers([]);
      selectServer(null);
      setServersInitialized(false);
    }
  }, [user]);

  // socket message listeners
  useEffect(() => {
    if (!socket || (socket as any)._chatListenersAttached) return;
    (socket as any)._chatListenersAttached = true;

    // Batch incoming messages within short window to avoid excessive re-renders
    let batchBuf: Message[] = [];
    let batchTimer: ReturnType<typeof setTimeout> | null = null;

    const flushBatch = () => {
      if (batchBuf.length === 0) return;
      const toInsert: Message[] = [];
      batchBuf.forEach((m: any) => {
        if (m.clientNonce && pendingMap[m.clientNonce]) {
          const tempId = pendingMap[m.clientNonce];
          delete pendingMap[m.clientNonce];
          // merge real data into existing optimistic bubble to avoid remount
          updateMessage({ ...m, id: tempId });
        } else {
          toInsert.push(m);
        }
      });
      if (toInsert.length) {
        // single bulk update
        useServerStore.getState().addMessages(toInsert);
      }
      batchBuf = [];
      batchTimer = null;
    };

    const add = (m: any) => {
      batchBuf.push(m);
      if (!batchTimer) {
        batchTimer = setTimeout(flushBatch, 50);
      }
    };

    const upd = (m: Message) => updateMessage(m);
    const del = (id: string) => removeMessage(id);

    socket.on('message:new', add);
    socket.on('message:updated', upd);
    socket.on('message:deleted', del);
    socket.on('server:deleted', (srvId: string) => {
      const { setSelectedServer } = useServerStore.getState();
      if (selectedServerRef.current?.id === srvId) {
        setSelectedServer(null);
      }
      // also remove server from list
      useServerStore.setState((state)=>({servers: state.servers.filter(s=>s.id!==srvId)}));
    });

    socket.on('server:updated', (srv: Server) => {
      // update servers list and selected server details if relevant
      useServerStore.setState((state) => ({
        servers: state.servers.map((s) => (s.id === srv.id ? { ...s, name: srv.name, icon: srv.icon } : s)),
      }));
      if (selectedServerRef.current?.id === srv.id) {
        useServerStore.setState({ selectedServer: { ...selectedServerRef.current, name: srv.name, icon: srv.icon } as any });
      }
    });

    socket.on('user:listening', (userId: string, listening: boolean) => {
      setListeningState(userId, listening);
    });

    return () => {
      // not detaching to keep singleton listeners
    };
  }, [socket, addMessage, updateMessage, removeMessage, setListeningState]);

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
    fetchServers: () => {},
    sendMessage,
    listeningStates,
  };
}; 