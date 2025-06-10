// =================================
// Basic API & Entity Types
// =================================

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
  inviteCode: string;
  ownerId: string;
  members: Member[];
  _count: {
    members: number;
    messages: number;
  };
}

// Message entity (as returned by the API with author)
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

// =================================
// API-specific response types
// =================================

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