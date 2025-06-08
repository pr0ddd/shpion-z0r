// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND';
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

// Server types
export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  livekitVoiceRoom: string;
  voiceChannelName: string;
  maxVoiceUsers: number;
  textChannelName: string;
  _count: {
    members: number;
    messages: number;
    streams: number;
  };
}

// Server Member types
export interface ServerMember {
  id: string;
  userId: string;
  serverId: string;
  roleType: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  canAccessTextChat: boolean;
  canAccessVoiceChat: boolean;
  canAccessStreams: boolean;
  canCreateStreams: boolean;
  voiceConnectedAt?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  connectionQuality?: string;
  user: User;
}

// Message types
export interface Message {
  id: string;
  content: string;
  userId: string;
  serverId: string;
  createdAt: string;
  updatedAt: string;
  author: User;
}

// Stream types
export interface Stream {
  id: string;
  title: string;
  description?: string;
  streamerId: string;
  serverId: string;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED';
  livekitStreamRoom: string;
  maxViewers: number;
  startedAt?: string;
  endedAt?: string;
  streamer: User;
}

// LiveKit types
export interface LiveKitToken {
  token: string;
  wsUrl: string;
}

export interface VoiceStatus {
  roomName: string;
  voiceChannelName: string;
  maxUsers: number;
  connectedMembers: ServerMember[];
  liveKitParticipants: any[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  validateToken: () => Promise<boolean>;
} 