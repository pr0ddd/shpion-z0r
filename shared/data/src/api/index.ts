import axios, { AxiosRequestHeaders } from 'axios';
import { authRequest, authResponseErrorHandler } from './interceptors';

// Vite env; cast to bypass TS in library build
const API_BASE_URL = (import.meta as any).env.VITE_API_URL as string;
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL env variable is missing');
}

const http = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(authRequest as any); // TODO: fix types
http.interceptors.response.use(
  (res) => res,
  authResponseErrorHandler as any // TODO: fix types
);

export * from './authAPI';
export * from './serverAPI';
export * from './inviteAPI';
export * from './messageAPI';
export * from './livekitAPI';
export * from './sfuAPI';
export * from './userAPI';
export default http;
