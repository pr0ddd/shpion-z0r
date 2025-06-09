import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { User, VoiceState, Server } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// More specific event types for clarity
interface ServerToClientEvents {
  'user:joined': (data: { user: User, serverId: string }) => void;
  'user:left': (data: { userId: string, serverId: string }) => void;
  'server:user_list': (data: { users: User[], serverId: string }) => void;
  'voice:state_update': (data: { voiceStates: VoiceState[], serverId: string }) => void;
}

interface ClientToServerEvents {
  'server:join': (data: { serverId: string }) => void;
  'server:leave': (data: { serverId: string }) => void;
  'voice:join': (data: { serverId: string }) => void;
  'voice:leave': (data: { serverId: string }) => void;
}

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: AppSocket | null;
  isConnected: boolean;
  serverUsers: Map<string, User[]>;
  serverVoiceStates: Map<string, VoiceState[]>;
  joinServer: (serverId: string) => void;
  leaveServer: (serverId: string) => void;
  joinVoice: (serverId: string) => void;
  leaveVoice: (serverId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef<AppSocket | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [serverUsers, setServerUsers] = useState<Map<string, User[]>>(new Map());
  const [serverVoiceStates, setServerVoiceStates] = useState<Map<string, VoiceState[]>>(new Map());

  // Effect to manage the socket lifecycle
  useEffect(() => {
    if (token) {
      const socket = io(API_BASE_URL, {
        query: { token },
        transports: ['websocket'],
      });

      socketRef.current = socket;

      // Basic connection events
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));

      // Custom app events
      socket.on('server:user_list', ({ users, serverId }) => {
        setServerUsers(prev => new Map(prev).set(serverId, users));
      });
      socket.on('voice:state_update', ({ voiceStates, serverId }) => {
        setServerVoiceStates(prev => new Map(prev).set(serverId, voiceStates));
      });

      // Cleanup on unmount or token change
      return () => {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      };
    } else {
        // Ensure socket is disconnected if token is removed
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }
  }, [token]);

  // Stable functions to interact with the socket
  const joinServer = useCallback((serverId: string) => {
    socketRef.current?.emit('server:join', { serverId });
  }, []);

  const leaveServer = useCallback((serverId: string) => {
    socketRef.current?.emit('server:leave', { serverId });
  }, []);

  const joinVoice = useCallback((serverId:string) => {
    socketRef.current?.emit('voice:join', { serverId });
  }, []);

  const leaveVoice = useCallback((serverId: string) => {
    socketRef.current?.emit('voice:leave', { serverId });
  }, []);
  
  const value = useMemo(() => ({
    socket: socketRef.current,
    isConnected,
    serverUsers,
    serverVoiceStates,
    joinServer,
    leaveServer,
    joinVoice,
    leaveVoice,
  }), [isConnected, serverUsers, serverVoiceStates, joinServer, leaveServer, joinVoice, leaveVoice]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 