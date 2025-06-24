// ----------------------------------------------
// Shared Types Library
// ----------------------------------------------

// Generic API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User entity
export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: string;
}

// Member entity
export interface Member {
  id: string;
  role: 'ADMIN' | 'MEMBER';
  userId: string;
  serverId: string;
  user: User;
}

// Server entity
export interface Server {
  id: string;
  name: string;
  icon: string | null;
  description?: string | null;
  sfuId?: string | null;
  sfu?: SfuServer | null;
  inviteCode: string;
  ownerId: string;
  members: Member[];
  _count: {
    members: number;
    messages: number;
  };
}

// Message entity
export interface Message {
  id: string;
  content: string;
  authorId: string;
  serverId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  status?: 'sending' | 'failed';
}

// Auth responses
export interface LoginResponseData {
  user: User;
  token: string;
}

// Invite responses
export interface PublicInviteInfo {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

// Socket types
export interface SocketUser {
  id: string;
  username: string;
  avatar?: string | null;
}

export interface ServerToClientEvents {
  'server:state': (data: { serverId: string; users: SocketUser[] }) => void;
  'user:joined': (member: Member, serverId: string) => void;
  'user:left': (userId: string, serverId: string) => void;
  'user:listening': (userId: string, listening: boolean) => void;
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string, serverId: string) => void;
  'server:deleted': (serverId: string) => void;
  'server:updated': (server: Server) => void;
  'server:created': (server: Server) => void;
  'preview:update': (sid: string, dataUrl: string) => void;
}

export interface ClientToServerEvents {
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
  'message:send': (
    data: { serverId: string; content: string },
    callback: (ack: { success: boolean }) => void,
  ) => void;
  'user:listening': (listening: boolean) => void;
  'preview:update': (sid: string, dataUrl: string) => void;
}

export interface SfuServer {
  id: string;
  name: string;
  url: string;
} 