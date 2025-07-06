import { authAPI } from '@shared/data';
import { useMutation } from '@tanstack/react-query';

const logout = async (): Promise<void> => {
  try {
    const res = await authAPI.logout();
    if (res.success && res.data) return res.data;
    throw new Error('Failed to create server');
  } catch (error) {
    throw error.response?.data.error;
  }
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: async () => await logout(),
    onSuccess: () => {
      // TODO: clear local storage
    },
    onError: (error: unknown) => {
      console.error(error);
    },
  });
};
