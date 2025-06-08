import axios from 'axios';
import { ApiResponse, User, Server } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  console.log('API Request:', config.url, 'Token:', token ? 'Present' : 'Missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.log('API Error:', error.config?.url, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Token might be invalid, but NOT reloading page');
      localStorage.removeItem('authToken');
      // window.location.reload(); // Убираем автоматическую перезагрузку
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> =>
    api.post('/auth/login', { email, password }).then(res => res.data),

  register: (email: string, username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> =>
    api.post('/auth/register', { email, username, password }).then(res => res.data),

  me: (): Promise<ApiResponse<User>> =>
    api.get('/auth/me').then(res => res.data),
};

// Server API
export const serverAPI = {
  getServers: (): Promise<ApiResponse<Server[]>> =>
    api.get('/servers').then(res => res.data),

  createServer: (name: string, description?: string): Promise<ApiResponse<any>> =>
    api.post('/servers', { name, description }).then(res => res.data),

  getServerVoiceState: (serverId: string): Promise<ApiResponse<any>> =>
    api.get(`/servers/${serverId}/voice`).then(res => res.data),

  getServerMembers: (serverId: string): Promise<ApiResponse<any>> =>
    api.get(`/servers/${serverId}/members`).then(res => res.data),

  // Invite methods
  getServerInvites: (serverId: string): Promise<ApiResponse<any>> =>
    api.get(`/servers/${serverId}/invites`).then(res => res.data),

  createInvite: (serverId: string, data: { maxUses?: number; expiresInHours?: number }): Promise<ApiResponse<any>> =>
    api.post(`/servers/${serverId}/invites`, data).then(res => res.data),

  deleteInvite: (inviteId: string): Promise<ApiResponse<any>> =>
    api.delete(`/invites/${inviteId}`).then(res => res.data),

  getInviteInfo: (inviteCode: string): Promise<ApiResponse<any>> =>
    api.get(`/invites/${inviteCode}/info`).then(res => res.data),

  useInvite: (inviteCode: string): Promise<ApiResponse<any>> =>
    api.post(`/invites/${inviteCode}/use`).then(res => res.data),
};

// LiveKit API
export const livekitAPI = {
  getVoiceToken: (serverId: string): Promise<ApiResponse<{ token: string; wsUrl: string }>> =>
    api.post(`/livekit/voice/${serverId}/token`).then(res => res.data),
};

// User API
export const userAPI = {
  getCurrentUser: (): Promise<ApiResponse<User & { servers: Server[]; currentServerId: string | null }>> =>
    api.get('/users/me').then(res => res.data),
};

export default api; 