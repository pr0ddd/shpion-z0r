import { Request } from 'express';
import { User } from '@prisma/client';

// Расширяем Express Request для добавления пользователя
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response типы
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Socket.IO событияы
export interface ServerToClientEvents {
  // Сообщения
  'message:new': (message: any) => void;
  'message:updated': (message: any) => void;
  'message:deleted': (messageId: string) => void;
  
  // Пользователи
  'user:joined': (user: any) => void;
  'user:left': (userId: string) => void;
  'user:status_changed': (userId: string, status: string) => void;
  
  // Голосовой чат
  'voice:user_joined': (userId: string, serverId: string) => void;
  'voice:user_left': (userId: string, serverId: string) => void;
  'voice:user_muted': (data: { userId: string, username: string, isMuted: boolean, serverId: string }) => void;
  'voice:user_deafened': (data: { userId: string, username: string, isDeafened: boolean, serverId: string }) => void;
  'voice:user_speaking': (userId: string, isSpeaking: boolean) => void;
  
  // Стримы
  'stream:started': (stream: any) => void;
  'stream:ended': (streamId: string) => void;
  'stream:viewer_joined': (streamId: string, userId: string) => void;
  'stream:viewer_left': (streamId: string, userId: string) => void;
}

export interface ClientToServerEvents {
  // Подключение к серверу
  'server:join': (serverId: string) => void;
  'server:leave': (serverId: string) => void;
  
  // Сообщения
  'message:send': (serverId: string, content: string) => void;
  'message:edit': (messageId: string, content: string) => void;
  'message:delete': (messageId: string) => void;
  
  // Голосовой чат
  'voice:join': (serverId: string) => void;
  'voice:leave': (serverId: string) => void;
  'voice:user_muted': (data: { serverId: string, userId: string, username: string, isMuted: boolean }) => void;
  'voice:user_deafened': (data: { serverId: string, userId: string, username: string, isDeafened: boolean }) => void;
}

// LiveKit типы
export interface LiveKitTokenData {
  roomName: string;
  identity: string;
  token: string;
  expiresAt: Date;
}

// Права доступа
export interface ServerPermissions {
  canAccessTextChat: boolean;
  canAccessVoiceChat: boolean;
  canAccessStreams: boolean;
  canCreateStreams: boolean;
} 