import { serverAPI, ServerCreateDto } from '@shared/data';
import { Server } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerStore } from '../model';

const createServer = async (payload: ServerCreateDto): Promise<Server> => {
  try {
    const res = await serverAPI.createServer(payload);
    if (res.success && res.data) return res.data;
  
    throw new Error(res.error || 'Failed to create server');
  } catch (error) {
    throw error.response?.data.error;
  }
};

export const useCreateServerMutation = () => {
  const queryClient = useQueryClient();
  const { setSelectedServerId } = useServerStore();

  return useMutation({
    mutationFn: async (payload: ServerCreateDto) => await createServer(payload),
    onSuccess: (data: Server) => {
      queryClient.setQueryData(['servers'], (old: Server[]) => [...old, data]);
      setSelectedServerId(data.id);

      // TODO: select new server ?
    },
    onError: (error: unknown) => {
      console.error(error)
    },
  });
};
