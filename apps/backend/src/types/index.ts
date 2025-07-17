import { Request } from 'express';
import { SystemSettingsPayload } from '@shared/types';

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

export type BulkUpdateSystemSettingsRequest = SystemSettingsPayload;