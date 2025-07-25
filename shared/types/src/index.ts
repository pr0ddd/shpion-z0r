// ----------------------------------------------
// Shared Types Library
// ----------------------------------------------

// Generic API response structure
export type ApiResponse<T = unknown, E = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error?: E;
      errors?: E[];
    };

// User entity
export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: Date;
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
  attachment?: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  authorId: string;
  serverId: string;
  createdAt: string;
  updatedAt: string;
  // optimistic helpers
  status?: 'thinking' | 'failed' | 'uploading';
  uploadTotal?: number;
  uploadLoaded?: number;
  replyToId?: string | null;
  replyTo?: Message | null;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
}

// Auth responses
export interface LoginResponseData {
  user: User;
  token: string;
}
export type LoginResponseError = string | {
  type: 'field';
  location: string;
  msg: string;
  path: string;
  value: string;
};

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
  'user:updated': (member: Member, serverId: string) => void;
  'user:listening': (userId: string, listening: boolean) => void;
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string, serverId: string) => void;
  'typing': (payload: { userId: string; serverId: string; typing: boolean; username: string }) => void;
  'server:deleted': (serverId: string) => void;
  'server:updated': (server: Server) => void;
  'server:created': (server: Server) => void;
  'preview:update': (sid: string, dataUrl: string) => void;
  'bot:thinking': (payload: any) => void;
}

export interface ClientToServerEvents {
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
  'message:send': (
    data: { serverId: string; content: string },
    callback: (ack: { success: boolean }) => void
  ) => void;
  'user:listening': (listening: boolean) => void;
  'typing': (payload: { serverId: string; typing: boolean }) => void;
  'preview:update': (sid: string, dataUrl: string) => void;
  'bot:thinking': (payload: any) => void;
}

export interface SfuServer {
  id: string;
  name: string;
  url: string;
}

export interface SystemSetting {
  id: number;
  code_name: string;
  description: string | null;
  value: string;
}

// Volume Preference
export interface VolumePreference {
  id: string;
  ownerId: string;
  targetUserId: string;
  volume: number; // 0..1
  createdAt: string;
  updatedAt: string;
}

export type SystemSettingsPayload = Pick<SystemSetting, 'id' | 'value'>[];