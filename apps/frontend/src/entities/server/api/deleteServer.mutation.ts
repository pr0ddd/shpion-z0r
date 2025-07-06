import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serverAPI, ServerDeleteDto } from '@shared/data';
import { Server } from '@shared/types';

const deleteServer = async (payload: ServerDeleteDto): Promise<void> => {
  const res = await serverAPI.deleteServer(payload);
  if (res.success) return;
  throw new Error(res.error || 'Failed to delete server');
};

export const useDeleteServerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ServerDeleteDto) => await deleteServer(payload),
    onSuccess: (_, { serverId }) => {
      queryClient.setQueryData(['servers'], (old: Server[]) =>
        old.filter((server) => server.id !== serverId)
      );
    },
    onError: (error: Error) => {
      console.error(error);
    },
  });
};
