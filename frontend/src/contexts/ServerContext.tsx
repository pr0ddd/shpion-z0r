import React, { createContext, useContext, useCallback, useMemo, useState, ReactNode, useEffect, useRef } from 'react';
import { serverAPI, messageAPI, userAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { Server, Message, Member } from '../types';
import { Participant } from 'livekit-client';

interface ServerContextType {
    servers: Server[];
    setServers: React.Dispatch<React.SetStateAction<Server[]>>;
    selectedServer: Server | null;
    members: Member[];
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    selectServer: (server: Server | null) => void;
    fetchServers: () => Promise<void>;
    addMessage: (message: Message) => void;
    updateMessage: (message: Message) => void;
    removeMessage: (messageId: string) => void;
    updateMembersFromLiveKit: (participants: Participant[]) => void;
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
            }
        }
        
        setSelectedServer(server);
        if (server) {
            // Members are now handled by LiveKitPresence, so we just clear the list initially.
            setMembers([]);
            try {
                const res = await messageAPI.getMessages(server.id);
                if (res.success && res.data) {
                    setMessages(res.data);
                } else {
                    console.error("Failed to fetch messages for server", server.id);
                    setMessages([]);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
                setMessages([]);
            }
        } else {
            setMembers([]);
            setMessages([]);
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
                if (response.data.length > 0 && !selectedServerRef.current) {
                    selectServer(response.data[0]);
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
    
    const updateMembersFromLiveKit = useCallback(async (participants: Participant[]) => {
        const currentServerId = selectedServerRef.current?.id;
        if (!currentServerId || participants.length === 0) {
            setMembers([]);
            return;
        }

        const userIds = participants.map(p => p.identity);
        
        try {
            const res = await userAPI.getUsersByIds(userIds);
            if (res.success && res.data) {
                const usersData = res.data;
                const memberMap = new Map(usersData.map(u => [u.id, u]));

                const newMembers: Member[] = participants.map(p => {
                    const user = memberMap.get(p.identity);
                    return {
                        id: p.sid, // Use LiveKit SID as the unique key for the member entry
                        userId: p.identity,
                        serverId: currentServerId,
                        role: 'MEMBER', // Role management can be added later if needed
                        user: user || { id: p.identity, email: '', username: p.name || 'Unknown', avatar: null, createdAt: new Date().toISOString() }
                    };
                });
                
                setMembers(newMembers);
            }
        } catch (error) {
            console.error("Failed to fetch user details for members:", error);
            // Fallback to basic info from LiveKit
            const fallbackMembers: Member[] = participants.map(p => ({
                id: p.sid,
                userId: p.identity,
                serverId: currentServerId,
                role: 'MEMBER',
                user: { id: p.identity, email: '', username: p.name || 'Unknown', avatar: null, createdAt: new Date().toISOString() }
            }));
            setMembers(fallbackMembers);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchServers();
        } else {
            setServers([]);
            setSelectedServer(null);
            setMembers([]);
            setMessages([]);
        }
    }, [user, fetchServers]);

    const addMessage = useCallback((message: Message) => {
        if (message.serverId === selectedServerRef.current?.id) {
            setMessages(prev => [...prev, message]);
        }
    }, []);

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

    const contextValue = useMemo(() => ({
        servers,
        setServers,
        selectedServer,
        members,
        messages,
        isLoading,
        error,
        selectServer,
        fetchServers,
        addMessage,
        updateMessage,
        removeMessage,
        updateMembersFromLiveKit,
    }), [servers, selectedServer, members, messages, isLoading, error, selectServer, fetchServers, addMessage, updateMessage, removeMessage, updateMembersFromLiveKit]);

    return (
        <ServerContext.Provider value={contextValue}>
            {children}
        </ServerContext.Provider>
    );
}; 