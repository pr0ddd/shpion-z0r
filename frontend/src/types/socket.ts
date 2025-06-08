// ============================================================================
// SOCKET EVENT TYPES - Complete WebSocket Architecture
// ============================================================================

// ===== Base Types =====
export interface User {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface VoiceParticipant {
  id: string;
  username: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  isLocal: boolean;
}

export interface Message {
  id: string;
  serverId: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: number;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
}

// ===== Client to Server Events =====
export interface ClientToServerEvents {
  // User events
  'user:online': (data: { userId: string; username: string; avatar?: string }) => void;
  'user:offline': (data: { userId: string }) => void;
  
  // Voice events
  'voice:join': (data: { serverId: string; userId: string; username: string }) => void;
  'voice:leave': (data: { serverId: string; userId: string }) => void;
  'voice:user_muted': (data: { userId: string; username: string; serverId: string; isMuted: boolean; timestamp: number }) => void;
  'voice:user_deafened': (data: { userId: string; username: string; serverId: string; isDeafened: boolean; timestamp: number }) => void;
  
  // Chat events
  'chat:message_send': (data: { serverId: string; content: string; userId: string; timestamp: number; replyTo?: string }) => void;
  'chat:typing_start': (data: { serverId: string; userId: string; username: string }) => void;
  'chat:typing_stop': (data: { serverId: string; userId: string }) => void;
  
  // Server events
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
  
  // Presence events
  'presence:request': (data: { serverId?: string }) => void;
}

// ===== Server to Client Events =====
export interface ServerToClientEvents {
  // Connection events (Socket.IO built-in)
  'connect': () => void;
  'disconnect': (reason: string) => void;
  
  // User events
  'user:joined': (data: { user: User; serverId?: string }) => void;
  'user:left': (data: { userId: string; username: string; serverId?: string }) => void;
  'user:status_changed': (data: { userId: string; username: string; status: User['status']; customStatus?: string }) => void;
  
  // Voice events
  'voice:user_joined': (data: { user: { id: string; username: string; avatar?: string }; serverId: string; timestamp: number }) => void;
  'voice:user_left': (data: { userId: string; username: string; serverId: string; timestamp: number }) => void;
  'voice:user_muted': (data: { userId: string; username: string; serverId: string; isMuted: boolean; timestamp: number }) => void;
  'voice:user_deafened': (data: { userId: string; username: string; serverId: string; isDeafened: boolean; timestamp: number }) => void;
  'voice:user_speaking': (data: { userId: string; serverId: string; isSpeaking: boolean; audioLevel?: number }) => void;
  
  // Chat events
  'chat:message_received': (data: Message) => void;
  'chat:user_typing': (data: { serverId: string; user: { id: string; username: string }; isTyping: boolean }) => void;
  
  // Server events
  'server:user_joined': (data: { serverId: string; user: User; timestamp: number }) => void;
  'server:user_left': (data: { serverId: string; userId: string; username: string; timestamp: number }) => void;
  
  // Presence events
  'presence:update': (data: { 
    serverId?: string; 
    users: Array<{
      id: string;
      username: string;
      avatar?: string;
      status: User['status'];
      isInVoice: boolean;
      voiceState?: {
        isMuted: boolean;
        isDeafened: boolean;
        isSpeaking: boolean;
      };
    }>;
    totalCount: number;
  }) => void;
  
  // Error events
  'error:general': (data: { code: string; message: string; details?: any; timestamp: number }) => void;
  'error:voice': (data: { code: 'VOICE_CONNECT_FAILED' | 'VOICE_TOKEN_EXPIRED' | 'VOICE_ROOM_FULL'; message: string; serverId: string }) => void;
}

// ===== Socket State Types =====
export interface SocketState {
  // Connection
  isConnected: boolean;
  currentServerId: string | null;
  
  // User presence
  onlineUsers: Map<string, User>;
  typingUsers: Map<string, string[]>; // serverId -> userIds
  
  // Voice state
  voiceParticipants: Map<string, VoiceParticipant[]>; // serverId -> participants
  currentUserVoiceState: {
    isMuted: boolean;
    isDeafened: boolean;
    serverId: string | null;
  };
  
  // Chat state
  messages: Map<string, Message[]>; // serverId -> messages
  unreadCounts: Map<string, number>; // serverId -> count
}

// ===== Socket Context Types =====
export interface SocketContextValue {
  // Connection state
  isConnected: boolean;
  
  // Socket instance
  socket: Socket | null;
  
  // State
  state: SocketState;
  
  // Actions
  actions: {
    // User actions
    setUserOnline: (userId: string, username: string, avatar?: string) => void;
    setUserOffline: (userId: string) => void;
    
    // Voice actions
    joinVoice: (serverId: string) => void;
    leaveVoice: (serverId: string) => void;
    toggleMute: () => void;
    toggleDeafen: () => void;
    
    // Chat actions
    sendMessage: (serverId: string, content: string, replyTo?: string) => void;
    startTyping: (serverId: string) => void;
    stopTyping: (serverId: string) => void;
    
    // Server actions
    joinServer: (serverId: string) => void;
    leaveServer: (serverId: string) => void;
    
    // Presence actions
    requestPresence: (serverId?: string) => void;
  };
}

// ===== Socket Hook Types =====
export interface UseSocketResult {
  isConnected: boolean;
  socket: Socket | null;
  state: SocketState;
  actions: SocketContextValue['actions'];
}

// ===== Re-export Socket type =====
export interface Socket {
  connected: boolean;
  id: string;
  emit<T extends keyof ClientToServerEvents>(event: T, ...args: Parameters<ClientToServerEvents[T]>): void;
  on<T extends keyof ServerToClientEvents>(event: T, listener: ServerToClientEvents[T]): void;
  off<T extends keyof ServerToClientEvents>(event: T, listener?: ServerToClientEvents[T]): void;
  connect(): void;
  disconnect(): void;
} 