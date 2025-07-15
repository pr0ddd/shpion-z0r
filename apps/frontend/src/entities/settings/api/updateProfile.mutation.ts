import { userAPI } from '@shared/data';
import { User, ApiResponse } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@entities/session/model/auth.store';

export const useUpdateProfileMutation = () => {
  const setUser = useSessionStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (username: string) => {
      const res = await userAPI.updateProfile(username);
      if (res.success) return res.data as User;
      const msg = 'error' in res && res.error ? String(res.error) : 'Failed to update profile';
      throw new Error(msg);
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}; 