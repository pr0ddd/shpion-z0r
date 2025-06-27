import { ApiResponse, PublicInviteInfo, Server } from "@shared/types";
import http from "./";

// --- Invites ---
export const inviteAPI = {
  getPublicInviteInfo: (code: string) =>
    http
      .get<ApiResponse<PublicInviteInfo>>(`/invites/${code}`)
      .then((res) => res.data),

  useInvite: (code: string) =>
    http.post<ApiResponse<Server>>(`/invites/${code}`).then((res) => res.data),

  regenerateInviteCode: (serverId: string) =>
    http
      .post<ApiResponse<{ inviteCode: string }>>(
        `/invites/${serverId}/regenerate`
      )
      .then((res) => res.data),
};
