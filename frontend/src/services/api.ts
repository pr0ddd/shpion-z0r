import axios from 'axios';
import { 
  ApiResponse, 
  User, 
  Server, 
  Message, 
  LoginResponse,
  LiveKitToken,
  VoiceStatus 
} from '../types';

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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚨 axios interceptor: 401 Unauthorized');
      console.log('🚨 axios interceptor: URL:', error.config?.url);
      // НЕ очищаем localStorage автоматически - пусть useAuth сам решает
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', { email, password }),

  register: (email: string, username: string, password: string): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/register', { 
      email, 
      username, 
      password 
    }),

  me: (): Promise<ApiResponse<User>> =>
    api.get('/auth/me'),

  logout: (): Promise<ApiResponse> =>
    api.post('/auth/logout'),
};

// Server API
export const serverAPI = {
  getServers: (): Promise<ApiResponse<Server[]>> =>
    api.get('/servers'),

  getServer: (serverId: string): Promise<ApiResponse<Server>> =>
    api.get(`/servers/${serverId}`),

  createServer: (name: string, description?: string): Promise<ApiResponse<Server>> =>
    api.post('/servers', { name, description }),

  leaveServer: (serverId: string): Promise<ApiResponse> =>
    api.delete(`/servers/${serverId}/leave`),

  // Invite methods
  getInvites: (serverId: string): Promise<ApiResponse<any[]>> =>
    api.get(`/servers/${serverId}/invites`),

  createInvite: (serverId: string, options: { maxUses?: number; expiresInHours?: number }): Promise<ApiResponse<any>> =>
    api.post(`/servers/${serverId}/invites`, options),

  deleteInvite: (inviteId: string): Promise<ApiResponse> =>
    api.delete(`/invites/${inviteId}`),

  useInvite: (inviteCode: string): Promise<ApiResponse<Server>> =>
    api.post(`/invites/${inviteCode}/use`),

  getInviteInfo: (inviteCode: string): Promise<ApiResponse<any>> =>
    api.get(`/invites/${inviteCode}/info`),

  getPublicInviteInfo: (inviteCode: string): Promise<ApiResponse<any>> =>
    axios.get(`${API_BASE_URL}/api/public/invites/${inviteCode}/public`).then(res => res.data),

  getMembers: (serverId: string): Promise<ApiResponse<any[]>> =>
    api.get(`/servers/${serverId}/members`),
};

// Message API
export const messageAPI = {
  getMessages: (serverId: string, page?: number): Promise<ApiResponse<Message[]>> =>
    api.get(`/messages/${serverId}`, { params: { page } }),

  sendMessage: (serverId: string, content: string): Promise<ApiResponse<Message>> =>
    api.post(`/messages/${serverId}`, { content }),

  editMessage: (messageId: string, content: string): Promise<ApiResponse<Message>> =>
    api.put(`/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string): Promise<ApiResponse> =>
    api.delete(`/messages/${messageId}`),
};

// LiveKit API
export const livekitAPI = {
  getVoiceToken: (serverId: string): Promise<ApiResponse<LiveKitToken>> =>
    api.post(`/livekit/voice/${serverId}/token`),

  leaveVoice: (serverId: string): Promise<ApiResponse> =>
    api.post(`/livekit/voice/${serverId}/leave`),

  getVoiceStatus: (serverId: string): Promise<ApiResponse<VoiceStatus>> =>
    api.get(`/livekit/voice/${serverId}/status`),

  getStreamToken: (streamId: string): Promise<ApiResponse<LiveKitToken & { isStreamer: boolean; streamTitle: string }>> =>
    api.post(`/livekit/stream/${streamId}/token`),
};

// Health check
export const healthAPI = {
  check: (): Promise<{ status: string; service: string; timestamp: string; version: string }> =>
    axios.get(`${API_BASE_URL}/health`).then(res => res.data),
};

export default api; 