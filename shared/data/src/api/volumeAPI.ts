import http from './';
import { ApiResponse, VolumePreference } from '@shared/types';

export const volumeAPI = {
  getPreferences: () =>
    http.get<ApiResponse<VolumePreference[]>>('/volumes').then((res) => res.data),
  setPreference: (targetUserId: string, volume: number) =>
    http
      .put<ApiResponse<VolumePreference>>(`/volumes/${targetUserId}`, { volume })
      .then((res) => res.data),
}; 