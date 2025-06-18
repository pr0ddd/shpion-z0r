import axios, { AxiosRequestHeaders } from 'axios';
import {
  ApiResponse,
  User,
  Server,
  LoginResponseData,
  PublicInviteInfo,
  Message,
  Member,
} from '@shared/types';

// Vite env; cast to bypass TS in library build
const API_BASE_URL = (import.meta as any).env.VITE_API_URL as string;
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL env variable is missing');
}

export const http = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('authToken');
  if (token) {
    const headers = (cfg.headers ?? {}) as AxiosRequestHeaders;
    headers.Authorization = `Bearer ${token}`;
    cfg.headers = headers;
  }
  return cfg;
});

http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(err);
  },
);

// --- Auth ---
export const authAPI = {
  login: (email: string, password: string) =>
    http.post<ApiResponse<LoginResponseData>>('/auth/login', { email, password }).then(res => res.data),
  register: (email: string, username: string, password: string) =>
    http.post<ApiResponse<LoginResponseData>>('/auth/register', { email, username, password }).then(res => res.data),
  me: () => http.get<ApiResponse<User>>('/auth/me').then(res => res.data),
  logout: () => http.post<ApiResponse>('/auth/logout').then(res => res.data),
};

// --- Servers ---
export const serverAPI = {
  getServers: () => http.get<ApiResponse<Server[]>>('/servers').then(res => res.data),
  createServer: (payload: { name: string; description?: string; icon?: string | null; sfuId?: string | null }) =>
    http.post<ApiResponse<Server>>('/servers', payload).then(res => res.data),
  leaveServer: (serverId: string) => http.post<ApiResponse>(`/servers/${serverId}/leave`).then(res => res.data),
  getServerMembers: (serverId: string) => http.get<ApiResponse<Member[]>>(`/servers/${serverId}/members`).then(res => res.data),
  deleteServer: (serverId: string) => http.delete<ApiResponse>(`/servers/${serverId}`).then(res=>res.data),
  renameServer: (serverId: string, name: string) => http.patch<ApiResponse<Server>>(`/servers/${serverId}`, { name }).then(res=>res.data),
  updateServer: (serverId: string, payload: Partial<{ name: string; description: string; icon: string | null; sfuId: string | null }>) =>
    http.patch<ApiResponse<Server>>(`/servers/${serverId}`, payload).then(res => res.data),
};

// --- Invites ---
export const inviteAPI = {
  getPublicInviteInfo: (code: string) => http.get<ApiResponse<PublicInviteInfo>>(`/invites/${code}`).then(res => res.data),
  useInvite: (code: string) => http.post<ApiResponse<Server>>(`/invites/${code}`).then(res => res.data),
  regenerateInviteCode: (serverId: string) => http.post<ApiResponse<{ inviteCode: string }>>(`/invites/${serverId}/regenerate`).then(res => res.data),
};

// --- Messages ---
export const messageAPI = {
  getMessages: (serverId: string, before?: string) =>
    http.get<ApiResponse<Message[]>>(`/messages/${serverId}${before ? `?before=${before}` : ''}`).then(res => res.data),
  sendMessage: (serverId: string, content: string) => http.post<ApiResponse<Message>>(`/messages/${serverId}`, { content }).then(res => res.data),
  editMessage: (id: string, content: string) => http.patch<ApiResponse<Message>>(`/messages/${id}`, { content }).then(res => res.data),
  deleteMessage: (id: string) => http.delete<ApiResponse<null>>(`/messages/${id}`).then(res => res.data),
};

// --- LiveKit ---
export const livekitAPI = {
  getVoiceToken: (serverId: string) => http.get<ApiResponse<{ token: string }>>(`/livekit/voice/${serverId}/token`).then(res => res.data),
};

// --- SFU servers ---
export const sfuAPI = {
  getList: () => http.get<ApiResponse<{ id: string; name: string; url: string }[]>>('/sfu').then(res => res.data),
};

export const dataClient = { http, authAPI, serverAPI, inviteAPI, messageAPI, livekitAPI, sfuAPI };
export default dataClient; 