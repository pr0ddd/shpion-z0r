import { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';

export const authRequest = (cfg: AxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    const headers = (cfg.headers ?? {}) as AxiosRequestHeaders;
    headers.Authorization = `Bearer ${token}`;
    cfg.headers = headers;
  }
  return cfg;
};
