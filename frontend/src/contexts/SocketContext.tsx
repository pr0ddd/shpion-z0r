import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUsers, setServerUsers] = useState<Map<string, User[]>>(new Map());
  const [serverVoiceStates, setServerVoiceStates] = useState<Map<string, VoiceState[]>>(new Map());
  const currentServerId = useRef<string | null>(null);

  useEffect(() => {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken');
    if (!token) return;

    console.log('🔌 Connecting to socket server...');
    const socketStartTime = performance.now();
    
    const newSocket = io('http://localhost:3001', {
      auth: {
        token
      },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      console.log('⏱️ Socket connection took:', (performance.now() - socketStartTime).toFixed(2), 'ms');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    // Server events
    newSocket.on('server:users_list', (users: User[], serverId: string) => {
      console.log('📋 Server users list:', users, 'for server:', serverId);
      setServerUsers(prev => new Map(prev).set(serverId, users));
    });

    newSocket.on('server:voice_states', (voiceStates: VoiceState[], serverId: string) => {
      console.log('🎤 Server voice states:', voiceStates, 'for server:', serverId);
      setServerVoiceStates(prev => new Map(prev).set(serverId, voiceStates));
    });

    // User presence events
    newSocket.on('user:joined', (user: User, serverId: string) => {
      console.log('👋 User joined:', user.username, 'to server:', serverId);
      setServerUsers(prev => {
        const newMap = new Map(prev);
        const currentUsers = newMap.get(serverId) || [];
        if (!currentUsers.find(u => u.id === user.id)) {
          newMap.set(serverId, [...currentUsers, user]);
        }
        return newMap;
      });
    });

    newSocket.on('user:left', (userId: string, serverId: string) => {
      console.log('👋 User left:', userId, 'from server:', serverId);
      setServerUsers(prev => {
        const newMap = new Map(prev);
        const currentUsers = newMap.get(serverId) || [];
        newMap.set(serverId, currentUsers.filter(u => u.id !== userId));
        return newMap;
      });
    });

    // Voice events
    newSocket.on('voice:user_joined', (voiceState: VoiceState) => {
      console.log('🎤 Voice user joined:', voiceState);
      setServerVoiceStates(prev => {
        const newMap = new Map(prev);
        const currentStates = newMap.get(voiceState.serverId) || [];
        if (!currentStates.find(v => v.userId === voiceState.userId)) {
          newMap.set(voiceState.serverId, [...currentStates, voiceState]);
        }
        return newMap;
      });
    });

    newSocket.on('voice:user_left', (userId: string, serverId: string) => {
      console.log('🔇 Voice user left:', userId, 'from server:', serverId);
      setServerVoiceStates(prev => {
        const newMap = new Map(prev);
        const currentStates = newMap.get(serverId) || [];
        newMap.set(serverId, currentStates.filter(v => v.userId !== userId));
        return newMap;
      });
    });

    newSocket.on('voice:user_muted', (userId: string, isMuted: boolean, serverId: string) => {
      console.log('🎤 Voice user muted:', userId, isMuted, 'in server:', serverId);
      setServerVoiceStates(prev => {
        const newMap = new Map(prev);
        const currentStates = newMap.get(serverId) || [];
        const updatedStates = currentStates.map(v => 
          v.userId === userId ? { ...v, isMuted } : v
        );
        newMap.set(serverId, updatedStates);
        return newMap;
      });
    });

    newSocket.on('voice:user_deafened', (userId: string, isDeafened: boolean, serverId: string) => {
      console.log('🔊 Voice user deafened:', userId, isDeafened, 'in server:', serverId);
      setServerVoiceStates(prev => {
        const newMap = new Map(prev);
        const currentStates = newMap.get(serverId) || [];
        const updatedStates = currentStates.map(v => 
          v.userId === userId ? { ...v, isDeafened } : v
        );
        newMap.set(serverId, updatedStates);
        return newMap;
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting socket...');
      newSocket.disconnect();
    };
  }, []);

  const joinServer = (serverId: string) => {
    if (!socket || !isConnected) return;
    
    // Покидаем предыдущий сервер
    if (currentServerId.current && currentServerId.current !== serverId) {
      console.log('👋 Leaving previous server:', currentServerId.current);
      socket.emit('server:leave', currentServerId.current);
    }
    
    console.log('🚪 Joining server:', serverId);
    socket.emit('server:join', serverId);
    currentServerId.current = serverId;
  };

  const leaveServer = (serverId: string) => {
    if (!socket || !isConnected) return;
    
    console.log('👋 Leaving server:', serverId);
    socket.emit('server:leave', serverId);
    if (currentServerId.current === serverId) {
      currentServerId.current = null;
    }
  };

  const joinVoice = (serverId: string) => {
    if (!socket || !isConnected) return;
    
    // Получаем данные пользователя из localStorage или другого источника
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      console.error('❌ No user data available for voice join');
      return;
    }
    
    console.log('🎤 Joining voice in server:', serverId);
    socket.emit('voice:join', {
      serverId,
      userId: user.id,
      username: user.username
    });
  };

  const leaveVoice = (serverId: string) => {
    if (!socket || !isConnected) return;
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      console.error('❌ No user data available for voice leave');
      return;
    }
    
    console.log('🔇 Leaving voice in server:', serverId);
    socket.emit('voice:leave', {
      serverId,
      userId: user.id
    });
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    serverUsers,
    serverVoiceStates,
    joinServer,
    leaveServer,
    joinVoice,
    leaveVoice
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 