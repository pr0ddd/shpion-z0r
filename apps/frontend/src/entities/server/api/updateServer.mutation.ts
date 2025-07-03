import { serverAPI, ServerUpdateDto } from '@shared/data';
import { Server } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const updateServer = async (payload: ServerUpdateDto): Promise<Server> => {
  try {
    const res = await serverAPI.updateServer(payload);
    if (res.success && res.data) return res.data;
    throw new Error(res.error || 'Failed to update server');
  } catch (error) {
    throw error.response?.data.error;
  }
};

export const useUpdateServerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ServerUpdateDto) => await updateServer(payload),
    onSuccess: (data: Server) => {
      queryClient.setQueryData(['servers'], (old: Server[]) =>
        old.map((server) => (server.id === data.id ? data : server))
      );
    },
    onError: (error: Error) => {
      console.error(error);
    },
  });
};
