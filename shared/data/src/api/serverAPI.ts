import { ApiResponse, Member, Server } from '@shared/types';
import http from './';

export interface ServerCreateDto {
  name: string;
  description?: string;
  icon?: string | null;
  sfuId?: string | null;
}

export interface ServerUpdateDto extends Partial<ServerCreateDto> {
  serverId: string;
}

export interface ServerDeleteDto {
  serverId: string;
}

export interface ServerCreateResponseDto {
  success: boolean;
  data: Server;
  error?: string; // TODO: server must return error message
}

export interface ServerUpdateResponseDto extends ServerCreateResponseDto {}

export interface ServerDeleteResponseDto {
  success: boolean;
  message: string;
  error?: string; // TODO: server must return error message
}

export interface ServerLeaveResponseDto {
  success: boolean;
  message: string;
  error?: string; // TODO: server must return error message
}

// --- Servers ---
export const serverAPI = {
  getServers: () =>
    http.get<ApiResponse<Server[]>>('/servers').then((res) => res.data),

  createServer: (payload: ServerCreateDto) =>
    http
      .post<ServerCreateResponseDto>('/servers', payload)
      .then((res) => res.data),

  deleteServer: (payload: ServerDeleteDto) =>
    http
      .delete<ServerDeleteResponseDto>(`/servers/${payload.serverId}`)
      .then((res) => res.data),

  updateServer: ({ serverId, ...payload }: ServerUpdateDto) =>
    http
      .patch<ServerUpdateResponseDto>(`/servers/${serverId}`, payload)
      .then((res) => res.data),

  leaveServer: (serverId: string) =>
    http
      .post<ServerLeaveResponseDto>(`/servers/${serverId}/leave`)
      .then((res) => res.data),

  getServerMembers: (serverId: string) =>
    http
      .get<ApiResponse<Member[]>>(`/servers/${serverId}/members`)
      .then((res) => res.data),
};
