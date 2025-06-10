import React, { createContext, useContext, useCallback, useMemo, useState, ReactNode, useEffect, useRef } from 'react';
import { serverAPI, messageAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { Server, Message, User, Member } from '../types';

interface ServerContextType {
    servers: Server[];
    setServers: React.Dispatch<React.SetStateAction<Server[]>>;
    selectedServer: Server | null;
    members: Member[];
    messages: Message[];
    isLoading: boolean;
    areMembersLoading: boolean;
    error: string | null;
    selectServer: (server: Server | null) => void;
    fetchServers: () => Promise<void>;
    addMessage: (message: Message) => void;
    updateMessage: (message: Message) => void;
    removeMessage: (messageId: string) => void;
    setOptimisticMessageStatus: (messageId: string, status: 'failed') => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const useServer = () => {
    const context = useContext(ServerContext);
    if (!context) {
        throw new Error('useServer must be used within a ServerProvider');
    }
    return context;
};

export const ServerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [areMembersLoading, setAreMembersLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedServerRef = useRef<Server | null>(null);
    useEffect(() => {
        selectedServerRef.current = selectedServer;
    }, [selectedServer]);

    const selectServer = useCallback(async (server: Server | null) => {
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
                    serverAPI.getServerMembers(server.id)
                ]);

                if (messagesRes.success && messagesRes.data) {
                    setMessages(messagesRes.data);
                } else {
                    console.error("Failed to fetch messages for server", server.id);
                    setMessages([]);
                }

                if (membersRes.success && membersRes.data) {
                    setMembers(membersRes.data);
                } else {
                    console.error("Failed to fetch members for server", server.id);
                    setMembers([]);
                }
            } catch (error) {
                console.error("Error fetching server data:", error);
                setMessages([]);
                setMembers([]);
            } finally {
                setAreMembersLoading(false);
            }
        } else {
            setMessages([]);
            setMembers([]);
        }
    }, [socket]);

    const fetchServers = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await serverAPI.getServers();
            if (response.success && response.data) {
                setServers(response.data);
                const lastSelectedId = localStorage.getItem('lastSelectedServerId');
                if (lastSelectedId) {
                    const serverToSelect = response.data.find(s => s.id === lastSelectedId);
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

    const addMessage = useCallback((message: Message) => {
        if (message.serverId !== selectedServerRef.current?.id) return;

        setMessages(prev => {
            if (message.authorId === user?.id && !message.status) {
                const optimisticIndex = prev.findLastIndex(m => m.status === 'sending' && m.authorId === user.id);
                if (optimisticIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[optimisticIndex] = message;
                    return newMessages;
                }
            }
            if (prev.some(m => m.id === message.id)) {
                return prev;
            }
            return [...prev, message];
        });
    }, [user]);

    const updateMessage = useCallback((updatedMessage: Message) => {
        if (updatedMessage.serverId === selectedServerRef.current?.id) {
            setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
        }
    }, []);

    const removeMessage = useCallback((messageId: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }, []);
    
    useEffect(() => {
        if (!socket) return;

        socket.on('message:new', addMessage);
        socket.on('message:updated', updateMessage);
        socket.on('message:deleted', removeMessage);
        
        return () => {
            socket.off('message:new', addMessage);
            socket.off('message:updated', updateMessage);
            socket.off('message:deleted', removeMessage);
        };
    }, [socket, addMessage, updateMessage, removeMessage]);

    const setOptimisticMessageStatus = useCallback((messageId: string, status: 'failed') => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, status } : msg));
    }, []);

    const contextValue = useMemo(() => ({
        servers,
        setServers,
        selectedServer,
        members,
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
    }), [servers, selectedServer, members, messages, isLoading, areMembersLoading, error, selectServer, fetchServers, addMessage, updateMessage, removeMessage, setOptimisticMessageStatus]);

    return (
        <ServerContext.Provider value={contextValue}>
            {children}
        </ServerContext.Provider>
    );
};