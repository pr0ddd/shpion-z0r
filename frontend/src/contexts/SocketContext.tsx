import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Импортируем useAuth

interface User {
  id: string;
  username: string;
  avatar: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND';
}

interface VoiceState {
  userId: string;
  username: string;
  serverId: string;
  isMuted: boolean;
  isDeafened: boolean;
  connectedAt: Date;
}

interface ServerToClientEvents {
  // User presence
  'user:joined': (user: User, serverId: string) => void;
  'user:left': (userId: string, serverId: string) => void;
  'user:status_changed': (userId: string, status: User['status']) => void;
  
  // Voice events
  'voice:user_joined': (voiceState: VoiceState) => void;
  'voice:user_left': (userId: string, serverId: string) => void;
  'voice:user_muted': (userId: string, isMuted: boolean, serverId: string) => void;
  'voice:user_deafened': (userId: string, isDeafened: boolean, serverId: string) => void;
  
  // Server events
  'server:users_list': (users: User[], serverId: string) => void;
  'server:voice_states': (voiceStates: VoiceState[], serverId: string) => void;
}

interface ClientToServerEvents {
  // Server join/leave
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
  
  // Voice controls
  'voice:join': (data: { serverId: string; userId: string; username: string }) => void;
  'voice:leave': (data: { serverId: string; userId: string }) => void;
  'voice:user_muted': (data: { serverId: string; userId: string; username: string; isMuted: boolean; timestamp: number }) => void;
  'voice:user_deafened': (data: { serverId: string; userId: string; username: string; isDeafened: boolean; timestamp: number }) => void;
  
  // User presence
  'user:set_status': (status: User['status']) => void;
}

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  serverUsers: Map<string, User[]>;
  serverVoiceStates: Map<string, VoiceState[]>;
  joinServer: (serverId: string) => void;
  leaveServer: (serverId: string) => void;
  joinVoice: (serverId: string) => void;
  leaveVoice: (serverId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth(); // Получаем токен и юзера из AuthContext
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUsers, setServerUsers] = useState<Map<string, User[]>>(new Map());
  const [serverVoiceStates, setServerVoiceStates] = useState<Map<string, VoiceState[]>>(new Map());

  // Обработчики событий сокета
  const onConnect = useCallback(() => {
    setIsConnected(true);
    console.log('Socket connected');
  }, []);

  const onDisconnect = useCallback(() => {
    setIsConnected(false);
    console.log('Socket disconnected');
  }, []);
  
  const onUserJoined = useCallback((newUser: User, serverId: string) => {
    setServerUsers(prev => {
      const newMap = new Map(prev);
      const currentUsers = newMap.get(serverId) || [];
      if (!currentUsers.find(u => u.id === newUser.id)) {
        newMap.set(serverId, [...currentUsers, newUser]);
      }
      return newMap;
    });
  }, []);

  const onUserLeft = useCallback((userId: string, serverId: string) => {
    setServerUsers(prev => {
      const newMap = new Map(prev);
      const currentUsers = newMap.get(serverId) || [];
      newMap.set(serverId, currentUsers.filter(u => u.id !== userId));
      return newMap;
    });
  }, []);

  const onVoiceUserJoined = useCallback((voiceState: VoiceState) => {
    setServerVoiceStates(prev => {
      const newMap = new Map(prev);
      const currentStates = newMap.get(voiceState.serverId) || [];
      if (!currentStates.find(v => v.userId === voiceState.userId)) {
        newMap.set(voiceState.serverId, [...currentStates, voiceState]);
      }
      return newMap;
    });
  }, []);
  
  const onVoiceUserLeft = useCallback((userId: string, serverId: string) => {
    setServerVoiceStates(prev => {
      const newMap = new Map(prev);
      const currentStates = newMap.get(serverId) || [];
      newMap.set(serverId, currentStates.filter(v => v.userId !== userId));
      return newMap;
    });
  }, []);


  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
      }
      return;
    };

    const newSocket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket']
    });

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('user:joined', onUserJoined);
    newSocket.on('user:left', onUserLeft);
    newSocket.on('voice:user_joined', onVoiceUserJoined);
    newSocket.on('voice:user_left', onVoiceUserLeft);
    
    setSocket(newSocket);

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('user:joined', onUserJoined);
      newSocket.off('user:left', onUserLeft);
      newSocket.off('voice:user_joined', onVoiceUserJoined);
      newSocket.off('voice:user_left', onVoiceUserLeft);
      newSocket.disconnect();
    };
  }, [token, onConnect, onDisconnect, onUserJoined, onUserLeft, onVoiceUserJoined, onVoiceUserLeft]);

  const joinServer = useCallback((serverId: string) => {
    socket?.emit('server:join', serverId);
  }, [socket]);

  const leaveServer = useCallback((serverId: string) => {
    socket?.emit('server:leave', serverId);
  }, [socket]);

  const joinVoice = useCallback((serverId: string) => {
    if (socket && user) {
      socket.emit('voice:join', { serverId, userId: user.id, username: user.username });
    }
  }, [socket, user]);

  const leaveVoice = useCallback((serverId: string) => {
    if (socket && user) {
      socket.emit('voice:leave', { serverId, userId: user.id });
    }
  }, [socket, user]);
  
  const value = useMemo(() => ({
    socket,
    isConnected,
    serverUsers,
    serverVoiceStates,
    joinServer,
    leaveServer,
    joinVoice,
    leaveVoice,
  }), [socket, isConnected, serverUsers, serverVoiceStates, joinServer, leaveServer, joinVoice, leaveVoice]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 