import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { 
  SocketContextValue, 
  SocketState, 
  User, 
  VoiceParticipant, 
  Message,
  ClientToServerEvents,
  ServerToClientEvents
} from '../types/socket';

// ============================================================================
// SOCKET CONTEXT IMPLEMENTATION
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ===== Initial State =====
const initialState: SocketState = {
  isConnected: false,
  currentServerId: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),
  voiceParticipants: new Map(),
  currentUserVoiceState: {
    isMuted: true,
    isDeafened: true,
    serverId: null,
  },
  messages: new Map(),
  unreadCounts: new Map(),
};

// ===== State Actions =====
type SocketAction = 
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CURRENT_SERVER'; payload: string | null }
  | { type: 'SET_USER_ONLINE'; payload: { userId: string; user: User } }
  | { type: 'SET_USER_OFFLINE'; payload: { userId: string } }
  | { type: 'SET_TYPING_USERS'; payload: { serverId: string; userIds: string[] } }
  | { type: 'SET_VOICE_PARTICIPANTS'; payload: { serverId: string; participants: VoiceParticipant[] } }
  | { type: 'UPDATE_VOICE_PARTICIPANT'; payload: { serverId: string; userId: string; updates: Partial<VoiceParticipant> } }
  | { type: 'SET_CURRENT_USER_VOICE_STATE'; payload: Partial<SocketState['currentUserVoiceState']> }
  | { type: 'ADD_MESSAGE'; payload: { serverId: string; message: Message } }
  | { type: 'SET_UNREAD_COUNT'; payload: { serverId: string; count: number } }
  | { type: 'CLEAR_SERVER_DATA'; payload: { serverId: string } }
  | { type: 'RESET_STATE' };

// ===== Reducer =====
function socketReducer(state: SocketState, action: SocketAction): SocketState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
      
    case 'SET_CURRENT_SERVER':
      return { ...state, currentServerId: action.payload };
      
    case 'SET_USER_ONLINE':
      const newOnlineUsers = new Map(state.onlineUsers);
      newOnlineUsers.set(action.payload.userId, action.payload.user);
      return { ...state, onlineUsers: newOnlineUsers };
      
    case 'SET_USER_OFFLINE':
      const updatedOnlineUsers = new Map(state.onlineUsers);
      updatedOnlineUsers.delete(action.payload.userId);
      return { ...state, onlineUsers: updatedOnlineUsers };
      
    case 'SET_TYPING_USERS':
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.set(action.payload.serverId, action.payload.userIds);
      return { ...state, typingUsers: newTypingUsers };
      
    case 'SET_VOICE_PARTICIPANTS':
      const newVoiceParticipants = new Map(state.voiceParticipants);
      newVoiceParticipants.set(action.payload.serverId, action.payload.participants);
      return { ...state, voiceParticipants: newVoiceParticipants };
      
    case 'UPDATE_VOICE_PARTICIPANT':
      const updatedVoiceParticipants = new Map(state.voiceParticipants);
      const currentParticipants = updatedVoiceParticipants.get(action.payload.serverId) || [];
      const updatedParticipants = currentParticipants.map(p => 
        p.id === action.payload.userId ? { ...p, ...action.payload.updates } : p
      );
      updatedVoiceParticipants.set(action.payload.serverId, updatedParticipants);
      return { ...state, voiceParticipants: updatedVoiceParticipants };
      
    case 'SET_CURRENT_USER_VOICE_STATE':
      return { 
        ...state, 
        currentUserVoiceState: { ...state.currentUserVoiceState, ...action.payload }
      };
      
    case 'ADD_MESSAGE':
      const newMessages = new Map(state.messages);
      const currentMessages = newMessages.get(action.payload.serverId) || [];
      newMessages.set(action.payload.serverId, [...currentMessages, action.payload.message]);
      return { ...state, messages: newMessages };
      
    case 'SET_UNREAD_COUNT':
      const newUnreadCounts = new Map(state.unreadCounts);
      newUnreadCounts.set(action.payload.serverId, action.payload.count);
      return { ...state, unreadCounts: newUnreadCounts };
      
    case 'CLEAR_SERVER_DATA':
      const clearedTypingUsers = new Map(state.typingUsers);
      const clearedVoiceParticipants = new Map(state.voiceParticipants);
      const clearedMessages = new Map(state.messages);
      const clearedUnreadCounts = new Map(state.unreadCounts);
      
      clearedTypingUsers.delete(action.payload.serverId);
      clearedVoiceParticipants.delete(action.payload.serverId);
      clearedMessages.delete(action.payload.serverId);
      clearedUnreadCounts.delete(action.payload.serverId);
      
      return {
        ...state,
        typingUsers: clearedTypingUsers,
        voiceParticipants: clearedVoiceParticipants,
        messages: clearedMessages,
        unreadCounts: clearedUnreadCounts,
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// ===== Context =====
const SocketContext = createContext<SocketContextValue | null>(null);

// ===== Provider Component =====
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const socketRef = useRef<any>(null);
  const isInitialized = useRef(false);

  console.log('🔌 SocketProvider State:', {
    isConnected: state.isConnected,
    currentServerId: state.currentServerId,
    onlineUsersCount: state.onlineUsers.size,
    voiceParticipantsCount: state.voiceParticipants.size,
  });

  // ===== Socket Event Handlers =====
  const setupEventHandlers = useCallback((socket: any) => {
    console.log('🎯 Setting up socket event handlers');

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // Authenticate user when connected
      if (user) {
        socket.emit('user:online', {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
        });
        
        // Request general presence update
        setTimeout(() => {
          socket.emit('presence:request', {});
        }, 200);
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    // User events
    socket.on('user:joined', (data: { user: User; serverId?: string }) => {
      console.log('👋 User joined:', data.user.username);
      dispatch({ type: 'SET_USER_ONLINE', payload: { userId: data.user.id, user: data.user } });
    });

    socket.on('user:left', (data: { userId: string; username: string; serverId?: string }) => {
      console.log('👋 User left:', data.username);
      dispatch({ type: 'SET_USER_OFFLINE', payload: { userId: data.userId } });
    });

    // Voice events
    socket.on('voice:user_joined', (data: { user: { id: string; username: string; avatar?: string }; serverId: string; timestamp: number }) => {
      console.log(`🎤 User ${data.user.username} joined voice in server ${data.serverId}`);
      // Add to voice participants if we're in the same server
      if (state.currentServerId === data.serverId) {
        const currentParticipants = state.voiceParticipants.get(data.serverId) || [];
        const newParticipant: VoiceParticipant = {
          id: data.user.id,
          username: data.user.username,
          avatar: data.user.avatar,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          audioLevel: 0,
          connectionQuality: 'good',
          isLocal: data.user.id === user?.id,
        };
        
        dispatch({
          type: 'SET_VOICE_PARTICIPANTS',
          payload: {
            serverId: data.serverId,
            participants: [...currentParticipants, newParticipant],
          },
        });
      }
    });

    socket.on('voice:user_left', (data: { userId: string; username: string; serverId: string; timestamp: number }) => {
      console.log(`🎤 User ${data.username} left voice in server ${data.serverId}`);
      if (state.currentServerId === data.serverId) {
        const currentParticipants = state.voiceParticipants.get(data.serverId) || [];
        const updatedParticipants = currentParticipants.filter(p => p.id !== data.userId);
        
        dispatch({
          type: 'SET_VOICE_PARTICIPANTS',
          payload: {
            serverId: data.serverId,
            participants: updatedParticipants,
          },
        });
      }
    });

    socket.on('voice:user_muted', (data: { userId: string; username: string; serverId: string; isMuted: boolean; timestamp: number }) => {
      console.log(`🔇 User ${data.username} muted: ${data.isMuted} in server ${data.serverId}`);
      
      if (state.currentServerId === data.serverId) {
        // Update local state if it's current user
        if (user && data.userId === user.id) {
          dispatch({ 
            type: 'SET_CURRENT_USER_VOICE_STATE', 
            payload: { isMuted: data.isMuted } 
          });
        }
        
        // Update participant state
        dispatch({
          type: 'UPDATE_VOICE_PARTICIPANT',
          payload: {
            serverId: data.serverId,
            userId: data.userId,
            updates: { isMuted: data.isMuted },
          },
        });
      }
    });

    socket.on('voice:user_deafened', (data: { userId: string; username: string; serverId: string; isDeafened: boolean; timestamp: number }) => {
      console.log(`🔇 User ${data.username} deafened: ${data.isDeafened} in server ${data.serverId}`);
      
      if (state.currentServerId === data.serverId) {
        // Update local state if it's current user
        if (user && data.userId === user.id) {
          dispatch({ 
            type: 'SET_CURRENT_USER_VOICE_STATE', 
            payload: { isDeafened: data.isDeafened } 
          });
        }
        
        // Update participant state
        dispatch({
          type: 'UPDATE_VOICE_PARTICIPANT',
          payload: {
            serverId: data.serverId,
            userId: data.userId,
            updates: { isDeafened: data.isDeafened },
          },
        });
      }
    });

    socket.on('voice:user_speaking', (data: { userId: string; serverId: string; isSpeaking: boolean; audioLevel?: number }) => {
      if (state.currentServerId === data.serverId) {
        dispatch({
          type: 'UPDATE_VOICE_PARTICIPANT',
          payload: {
            serverId: data.serverId,
            userId: data.userId,
            updates: { 
              isSpeaking: data.isSpeaking,
              audioLevel: data.audioLevel || 0,
            },
          },
        });
      }
    });

    // Chat events
    socket.on('chat:message_received', (data: Message) => {
      console.log(`💬 New message in server ${data.serverId} from ${data.author.username}`);
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { serverId: data.serverId, message: data } 
      });
    });

    socket.on('chat:user_typing', (data: { serverId: string; user: { id: string; username: string }; isTyping: boolean }) => {
      const currentTyping = state.typingUsers.get(data.serverId) || [];
      const updatedTyping = data.isTyping 
        ? [...currentTyping.filter(id => id !== data.user.id), data.user.id]
        : currentTyping.filter(id => id !== data.user.id);
      
      dispatch({
        type: 'SET_TYPING_USERS',
        payload: { serverId: data.serverId, userIds: updatedTyping },
      });
    });

    // Error events
    socket.on('error:general', (data: { code: string; message: string; details?: any; timestamp: number }) => {
      console.error('🚨 Socket error:', data);
      // TODO: Show toast notification
    });

    socket.on('error:voice', (data: { code: string; message: string; serverId: string }) => {
      console.error('🚨 Voice error:', data);
      // TODO: Show voice-specific error notification
    });

    // Presence events
    socket.on('presence:update', (data: { 
      serverId?: string; 
      users: Array<{
        id: string;
        username: string;
        avatar?: string;
        status: 'online' | 'away' | 'busy' | 'offline';
        isInVoice: boolean;
        voiceState?: {
          isMuted: boolean;
          isDeafened: boolean;
          isSpeaking: boolean;
        };
      }>;
      totalCount: number;
    }) => {
      console.log('👥 Presence update received:', data);
      
      // Update online users
      const newOnlineUsers = new Map();
      data.users.forEach(user => {
        newOnlineUsers.set(user.id, {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          status: user.status,
        });
      });
      
      // Update online users state
      data.users.forEach(user => {
        dispatch({ 
          type: 'SET_USER_ONLINE', 
          payload: { 
            userId: user.id, 
            user: {
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              status: user.status,
            }
          } 
        });
      });
      
      // Update voice participants if we have voice data
      if (data.serverId && state.currentServerId === data.serverId) {
        const voiceUsers = data.users.filter(u => u.isInVoice);
        if (voiceUsers.length > 0) {
          const voiceParticipants = voiceUsers.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
            isMuted: u.voiceState?.isMuted || false,
            isDeafened: u.voiceState?.isDeafened || false,
            isSpeaking: u.voiceState?.isSpeaking || false,
            audioLevel: 0,
            connectionQuality: 'good' as const,
            isLocal: u.id === user?.id,
          }));
          
          dispatch({
            type: 'SET_VOICE_PARTICIPANTS',
            payload: { serverId: data.serverId, participants: voiceParticipants },
          });
        }
      }
    });

  }, [state.currentServerId, user]);

  // ===== Initialize Socket =====
  useEffect(() => {
    if (isInitialized.current || !user) return;

    console.log('🚀 Initializing socket connection for user:', user.username);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('❌ No auth token found');
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      autoConnect: true,
    });

    socketRef.current = socket;
    isInitialized.current = true;

    setupEventHandlers(socket);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socket.disconnect();
      isInitialized.current = false;
    };
  }, [user, setupEventHandlers]);

  // ===== Action Handlers =====
  const actions: SocketContextValue['actions'] = {
    setUserOnline: useCallback((userId: string, username: string, avatar?: string) => {
      socketRef.current?.emit('user:online', { userId, username, avatar });
    }, []),

    setUserOffline: useCallback((userId: string) => {
      socketRef.current?.emit('user:offline', { userId });
    }, []),

    joinVoice: useCallback((serverId: string) => {
      if (user) {
        socketRef.current?.emit('voice:join', {
          serverId,
          userId: user.id,
          username: user.username,
        });
        dispatch({ type: 'SET_CURRENT_USER_VOICE_STATE', payload: { serverId } });
      }
    }, [user]),

    leaveVoice: useCallback((serverId: string) => {
      if (user) {
        socketRef.current?.emit('voice:leave', {
          serverId,
          userId: user.id,
        });
        dispatch({ type: 'SET_CURRENT_USER_VOICE_STATE', payload: { serverId: null } });
      }
    }, [user]),

    toggleMute: useCallback(() => {
      if (user && state.currentUserVoiceState.serverId) {
        const newMutedState = !state.currentUserVoiceState.isMuted;
        
        socketRef.current?.emit('voice:user_muted', {
          userId: user.id,
          username: user.username,
          serverId: state.currentUserVoiceState.serverId,
          isMuted: newMutedState,
          timestamp: Date.now(),
        });
        
        dispatch({ 
          type: 'SET_CURRENT_USER_VOICE_STATE', 
          payload: { isMuted: newMutedState } 
        });
      }
    }, [user, state.currentUserVoiceState]),

    toggleDeafen: useCallback(() => {
      if (user && state.currentUserVoiceState.serverId) {
        const newDeafenedState = !state.currentUserVoiceState.isDeafened;
        
        socketRef.current?.emit('voice:user_deafened', {
          userId: user.id,
          username: user.username,
          serverId: state.currentUserVoiceState.serverId,
          isDeafened: newDeafenedState,
          timestamp: Date.now(),
        });
        
        dispatch({ 
          type: 'SET_CURRENT_USER_VOICE_STATE', 
          payload: { isDeafened: newDeafenedState } 
        });
      }
    }, [user, state.currentUserVoiceState]),

    sendMessage: useCallback((serverId: string, content: string, replyTo?: string) => {
      if (user) {
        socketRef.current?.emit('chat:message_send', {
          serverId,
          content,
          userId: user.id,
          timestamp: Date.now(),
          replyTo,
        });
      }
    }, [user]),

    startTyping: useCallback((serverId: string) => {
      if (user) {
        socketRef.current?.emit('chat:typing_start', {
          serverId,
          userId: user.id,
          username: user.username,
        });
      }
    }, [user]),

    stopTyping: useCallback((serverId: string) => {
      if (user) {
        socketRef.current?.emit('chat:typing_stop', {
          serverId,
          userId: user.id,
        });
      }
    }, [user]),

    joinServer: useCallback((serverId: string) => {
      socketRef.current?.emit('server:join', serverId);
      dispatch({ type: 'SET_CURRENT_SERVER', payload: serverId });
      
      // Automatically request presence when joining server
      setTimeout(() => {
        socketRef.current?.emit('presence:request', { serverId });
      }, 100);
    }, []),

    leaveServer: useCallback((serverId: string) => {
      socketRef.current?.emit('server:leave', serverId);
      dispatch({ type: 'SET_CURRENT_SERVER', payload: null });
      dispatch({ type: 'CLEAR_SERVER_DATA', payload: { serverId } });
    }, []),

    requestPresence: useCallback((serverId?: string) => {
      socketRef.current?.emit('presence:request', { serverId });
    }, []),
  };

  const contextValue: SocketContextValue = {
    isConnected: state.isConnected,
    socket: socketRef.current,
    state,
    actions,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// ===== Hook =====
export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 