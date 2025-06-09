import { Request } from 'express';

export type RequestUser = {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: Date;
}

// Расширяем Express Request для добавления пользователя
export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

// API Response типы
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}