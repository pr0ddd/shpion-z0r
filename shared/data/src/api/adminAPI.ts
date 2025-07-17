import { ApiResponse, SystemSetting, SystemSettingsPayload } from '@shared/types';
import http from './';

export const adminAPI = {
  getSystemSettings: () =>
    http
      .get<ApiResponse<SystemSetting[]>>('/system-settings/')
      .then((res) => res.data)
      .catch((err) => {
        console.error('Failed to fetch system settings', err);
        return { success: true, data: [] };
      }),

  bulkUpdateSystemSettings: (data: SystemSettingsPayload) =>
    http
      .patch<ApiResponse<SystemSetting[]>>('/system-settings/bulk_update/', data)
      .then((res) => res.data),
};
