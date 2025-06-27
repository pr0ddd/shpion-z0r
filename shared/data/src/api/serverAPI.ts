import { ApiResponse, Member, Server } from '@shared/types';
import http from './';

// --- Servers ---
export const serverAPI = {
  getServers: () =>
    http.get<ApiResponse<Server[]>>('/servers').then((res) => res.data),

  createServer: (payload: {
    name: string;
    description?: string;
    icon?: string | null;
    sfuId?: string | null;
  }) =>
    http.post<ApiResponse<Server>>('/servers', payload).then((res) => res.data),

  leaveServer: (serverId: string) =>
    http
      .post<ApiResponse>(`/servers/${serverId}/leave`)
      .then((res) => res.data),

  getServerMembers: (serverId: string) =>
    http
      .get<ApiResponse<Member[]>>(`/servers/${serverId}/members`)
      .then((res) => res.data),

  deleteServer: (serverId: string) =>
    http.delete<ApiResponse>(`/servers/${serverId}`).then((res) => res.data),

  renameServer: (serverId: string, name: string) =>
    http
      .patch<ApiResponse<Server>>(`/servers/${serverId}`, { name })
      .then((res) => res.data),

  updateServer: (
    serverId: string,
    payload: Partial<{
      name: string;
      description: string;
      icon: string | null;
      sfuId: string | null;
    }>
  ) =>
    http
      .patch<ApiResponse<Server>>(`/servers/${serverId}`, payload)
      .then((res) => res.data),
};
