import { ApiResponse, LoginResponseData, User } from '@shared/types';
import http from './';

// --- Auth ---
export const authAPI = {
  login: (email: string, password: string) =>
    http
      .post<ApiResponse<LoginResponseData>>('/auth/login', { email, password })
      .then((res) => res.data),

  register: (email: string, username: string, password: string) =>
    http
      .post<ApiResponse<LoginResponseData>>('/auth/register', {
        email,
        username,
        password,
      })
      .then((res) => res.data),

  me: () => http.get<ApiResponse<User>>('/auth/me').then((res) => res.data),

  logout: () => http.post<ApiResponse>('/auth/logout').then((res) => res.data),
};
