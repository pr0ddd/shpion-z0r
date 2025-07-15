import { userAPI } from '@shared/data';
import { User } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@entities/session/model/auth.store';

export const useUpdateAvatarMutation = () => {
  const setUser = useSessionStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avatar: string) => {
      const res = await userAPI.updateAvatar(avatar);
      if (res.success) return res.data as User;
      const errMsg = 'error' in res && res.error ? String(res.error) : 'Failed to update avatar';
      throw new Error(errMsg);
    },
    onSuccess: (user) => {
      setUser(user);

      // Инвалидируем все списки участников, сокет пришлёт обновление
      queryClient.invalidateQueries({ queryKey: ['members'], exact: false });


    },
  });
}; 