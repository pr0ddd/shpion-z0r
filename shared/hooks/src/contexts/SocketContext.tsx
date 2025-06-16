import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ServerToClientEvents, ClientToServerEvents } from '@shared/types';

/// <reference types="vite/client" />
const SOCKET_HOST: string = (import.meta as any).env.VITE_API_URL;

if (!SOCKET_HOST) {
  throw new Error('REACT_APP_API_URL is not defined. Please check your .env file.');
}

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: AppSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const socket: AppSocket = io(SOCKET_HOST, {
        path: '/api/socket.io',
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        setIsConnected(false);
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.disconnect();
      };
    } else if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }
    return undefined;
  }, [token]);

  const value = React.useMemo(() => ({
    socket: socketRef.current,
    isConnected,
  }), [isConnected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 