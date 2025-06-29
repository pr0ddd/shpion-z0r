import { ApiResponse, Message } from '@shared/types';
import http from './';

// --- Messages ---
export const messageAPI = {
  getMessages: (serverId: string, before?: string) =>
    http
      .get<ApiResponse<Message[]>>(
        `/messages/${serverId}${before ? `?before=${before}` : ''}`
      )
      .then((res) => res.data),

  sendMessage: (serverId: string, content: string) =>
    http
      .post<ApiResponse<Message>>(`/messages/${serverId}`, { content })
      .then((res) => res.data),

  editMessage: (id: string, content: string) =>
    http
      .patch<ApiResponse<Message>>(`/messages/${id}`, { content })
      .then((res) => res.data),

  deleteMessage: (id: string) =>
    http.delete<ApiResponse<null>>(`/messages/${id}`).then((res) => res.data),

  sendBotMessage: (serverId: string, content: string) =>
    http
      .post<ApiResponse<Message>>(`/messages/${serverId}/bot`, { content })
      .then((res) => res.data),
};
