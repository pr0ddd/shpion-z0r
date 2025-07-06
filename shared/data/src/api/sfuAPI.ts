import { ApiResponse } from '@shared/types';
import http from './';

// --- SFU servers ---
export const sfuAPI = {
  getList: () =>
    http
      .get<ApiResponse<{ id: string; name: string; url: string }[]>>('/sfu') // TODO: add types
      .then((res) => res.data),
};
