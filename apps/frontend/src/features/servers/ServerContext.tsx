import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { serverAPI, messageAPI } from '@shared/data';
import { useAuth } from '@features/auth';
import { useSocket } from '@features/socket';

import { ServerContextType } from './server.types';
import { Member, Message, Server } from '@shared/types';

export const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [listeningStates, setListeningStates] = useState<
    Record<string, boolean>
  >({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [areMembersLoading, setAreMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServerRef = useRef<Server | null>(null);
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);

  const selectServer = useCallback(
    async (server: Server | null) => {
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

      setSelectedServer(server);
      if (server) {
        setAreMembersLoading(true);
        try {
          const [messagesRes, membersRes] = await Promise.all([
            messageAPI.getMessages(server.id),
            serverAPI.getServerMembers(server.id),
          ]);

          if (messagesRes.success && messagesRes.data) {
            setMessages(messagesRes.data);
          } else {
            console.error('Failed to fetch messages for server', server.id);
            setMessages([]);
          }

          if (membersRes.success && membersRes.data) {
            setMembers(membersRes.data);
          } else {
            console.error('Failed to fetch members for server', server.id);
            setMembers([]);
          }
        } catch (error) {
          console.error('Error fetching server data:', error);
          setMessages([]);
          setMembers([]);
        } finally {
          setAreMembersLoading(false);
        }
      } else {
        setMessages([]);
        setMembers([]);
      }
    },
    [socket]
  );

  const fetchServers = useCallback(async () => {
    console.log('fetchServers');
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await serverAPI.getServers();
      if (response.success && response.data) {
        setServers(response.data);
        const lastSelectedId = localStorage.getItem('lastSelectedServerId');
        if (lastSelectedId) {
          const serverToSelect = response.data.find(
            (s) => s.id === lastSelectedId
          );
          if (serverToSelect && !selectedServerRef.current) {
            selectServer(serverToSelect);
          }
        }
      } else {
        setError(response.error || 'Failed to fetch servers');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectServer]);

  useEffect(() => {
    if (user) {
      fetchServers();
    } else {
      setServers([]);
      setSelectedServer(null);
      setMessages([]);
      setMembers([]);
    }
  }, [user, fetchServers]);

  const addMessage = useCallback(
    (message: Message) => {
      if (message.serverId !== selectedServerRef.current?.id) return;

      setMessages((prev) => {
        if (message.authorId === user?.id && !message.status) {
          const optimisticIndex = prev.findLastIndex(
            (m) => m.status === 'sending' && m.authorId === user.id
          );
          if (optimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[optimisticIndex] = message;
            return newMessages;
          }
        }
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    },
    [user]
  );

  const updateMessage = useCallback((updatedMessage: Message) => {
    if (updatedMessage.serverId === selectedServerRef.current?.id) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
      );
    }
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', addMessage);
    socket.on('message:updated', updateMessage);
    socket.on('message:deleted', removeMessage);

    const handleListening = (userId: string, listening: boolean) => {
      setListeningStates((prev) => ({ ...prev, [userId]: listening }));
    };
    socket.on('user:listening', handleListening);

    return () => {
      socket.off('message:new', addMessage);
      socket.off('message:updated', updateMessage);
      socket.off('message:deleted', removeMessage);
      socket.off('user:listening', handleListening);
    };
  }, [socket, addMessage, updateMessage, removeMessage]);

  const setOptimisticMessageStatus = useCallback(
    (messageId: string, status: 'failed') => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
      );
    },
    []
  );

  const sendMessage = useCallback(
    (content: string) => {
      const server = selectedServerRef.current;
      if (content.trim() && server && user && socket) {
        const tempId = `temp_${Date.now()}`;
        const optimisticMessage: Message = {
          id: tempId,
          content: content,
          authorId: user.id,
          serverId: server.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
          },
          status: 'sending' as const,
        };

        addMessage(optimisticMessage);

        socket.emit(
          'message:send',
          { serverId: server.id, content: content },
          (ack: { success: boolean }) => {
            if (!ack.success) {
              setOptimisticMessageStatus(tempId, 'failed');
            }
          }
        );
      }
    },
    [user, socket, addMessage, setOptimisticMessageStatus]
  );

  const contextValue = useMemo(
    () => ({
      servers,
      setServers,
      selectedServer,
      members,
      listeningStates,
      messages,
      isLoading,
      areMembersLoading,
      error,
      selectServer,
      fetchServers,
      addMessage,
      updateMessage,
      removeMessage,
      setOptimisticMessageStatus,
      sendMessage,
    }),
    [
      servers,
      selectedServer,
      members,
      listeningStates,
      messages,
      isLoading,
      areMembersLoading,
      error,
      selectServer,
      fetchServers,
      addMessage,
      updateMessage,
      removeMessage,
      setOptimisticMessageStatus,
      sendMessage,
    ]
  );

  return (
    <ServerContext.Provider value={contextValue}>
      {children}
    </ServerContext.Provider>
  );
};
