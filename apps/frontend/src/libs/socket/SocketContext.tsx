import React, { createContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useSessionStore } from '@entities/session';
import { AppSocket, SocketContextType } from './socket.types';

/// <reference types="vite/client" />
const SOCKET_HOST: string = (import.meta as any).env.VITE_API_URL;

if (!SOCKET_HOST) {
  throw new Error('REACT_APP_API_URL is not defined. Please check your .env file.');
}

export const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useSessionStore(s => s.token);
  const socketRef = useRef<AppSocket | null>(null);
  const [isConnected, setIs] = useState(false);

  useEffect(() => {
    if (token) {
      const socket: AppSocket = io(SOCKET_HOST, {
        path: '/api/socket.io',
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 15000,
        randomizationFactor: 0.5,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        if ((import.meta as any).env?.DEV) {
          console.debug('🔌 Socket connected:', socket.id);
        }
        setIs(true);
      });

      socket.on('disconnect', () => {
        if ((import.meta as any).env?.DEV) {
          console.debug('🔌 Socket disconnected');
        }
        setIs(false);
      });

      let manualPing: ReturnType<typeof setInterval> | null = null;
      const ensureConnected = () => {
        if (socket.connected) {
          if (manualPing) {
            clearInterval(manualPing);
            manualPing = null;
          }
        } else if (!manualPing) {
          manualPing = setInterval(() => {
            if (!socket.connected) {
              socket.connect();
            }
          }, 10000); // 10 сек – реже, чем throttle браузера
        }
      };

      socket.on('disconnect', ensureConnected);
      socket.on('connect', ensureConnected);

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect', ensureConnected);
        socket.off('disconnect', ensureConnected);
        socket.disconnect();
        if (manualPing) clearInterval(manualPing);
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