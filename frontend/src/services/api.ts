import axios from 'axios';
import { 
  ApiResponse, 
  User, 
  Server, 
  LoginResponseData, 
  PublicInviteInfo,
  Message,
  Member
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  throw new Error('REACT_APP_API_URL is not defined in the environment. Please check your .env files.');
}

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
    
    // Check if the response exists and has a status of 401
    if (error.response?.status === 401) {
      // Prevent infinite loop on logout
      if (error.config.url?.endsWith('/auth/logout')) {
        return Promise.reject(error);
      }

      console.log('401 Unauthorized - Token might be invalid or expired. Logging out.');
      localStorage.removeItem('authToken');
      
      // Dispatch a custom event to notify the app of the auth error.
      // This is a cleaner way to handle global state changes from a service file.
      window.dispatchEvent(new Event('auth-error'));
    }
    
    return Promise.reject(error);
  }
);

// --- Auth API ---
export const authAPI = {
  login: (email: string, password: string): Promise<ApiResponse<LoginResponseData>> =>
    api.post('/auth/login', { email, password }).then(res => res.data),

  register: (email: string, username: string, password: string): Promise<ApiResponse<LoginResponseData>> =>
    api.post('/auth/register', { email, username, password }).then(res => res.data),

  me: (): Promise<ApiResponse<User>> =>
    api.get('/auth/me').then(res => res.data),

  logout: (): Promise<ApiResponse> =>
    api.post('/auth/logout').then(res => res.data),
};

// --- Server API ---
export const serverAPI = {
  getServers: (): Promise<ApiResponse<Server[]>> =>
    api.get('/servers').then(res => res.data),
  
  createServer: (name: string): Promise<ApiResponse<Server>> =>
    api.post('/servers', { name }).then(res => res.data),
  
  leaveServer: (serverId: string): Promise<ApiResponse> =>
    api.post(`/servers/${serverId}/leave`).then(res => res.data), // Changed from DELETE to POST for consistency, check backend route
  
  // Note: getServerMembers might be redundant if servers are fetched with members included
  getServerMembers: (serverId: string): Promise<ApiResponse<Member[]>> =>
    api.get(`/servers/${serverId}/members`).then(res => res.data),
};

// --- Invite API ---
export const inviteAPI = {
  getPublicInviteInfo: (inviteCode: string): Promise<ApiResponse<PublicInviteInfo>> =>
    api.get(`/invites/${inviteCode}`).then(res => res.data),
    
  useInvite: (inviteCode: string): Promise<ApiResponse<Server>> =>
    api.post(`/invites/${inviteCode}`).then(res => res.data),

  regenerateInviteCode: (serverId: string): Promise<ApiResponse<{ inviteCode: string }>> =>
    api.post(`/invites/${serverId}/regenerate`).then(res => res.data),
};

// --- Message API ---
export const messageAPI = {
  getMessages: (serverId: string, before?: string): Promise<ApiResponse<Message[]>> =>
    api.get(`/messages/${serverId}${before ? `?before=${before}` : ''}`).then(res => res.data),
  
  sendMessage: (serverId: string, content: string): Promise<ApiResponse<Message>> =>
    api.post(`/messages/${serverId}`, { content }).then(res => res.data),

  editMessage: (messageId: string, content: string): Promise<ApiResponse<Message>> =>
    api.patch(`/messages/${messageId}`, { content }).then(res => res.data),
    
  deleteMessage: (messageId: string): Promise<ApiResponse<null>> =>
    api.delete(`/messages/${messageId}`).then(res => res.data),
};


// --- LiveKit API ---
export const livekitAPI = {
  getVoiceToken: (serverId: string): Promise<ApiResponse<{ token: string }>> =>
    api.get(`/livekit/voice/${serverId}/token`).then(res => res.data),
};

// --- User API ---
export const userAPI = {
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    api.get('/users/me').then(res => res.data),

  getUsersByIds: (userIds: string[]): Promise<ApiResponse<User[]>> =>
    api.post('/users/by-ids', { userIds }).then(res => res.data),
};

export default api; 