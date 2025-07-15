import http from './index';
import { User, ApiResponse } from '@shared/types';

export const userAPI = {
  async updateAvatar(avatar: string): Promise<ApiResponse<User>> {
    const res = await http.put('/users/me/avatar', { avatar });
    return res.data;
  },
  async updateProfile(username: string): Promise<ApiResponse<User>> {
    const res = await http.put('/users/me', { username });
    return res.data;
  },
}; 