import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serverAPI } from '@shared/data';
import { Server } from '@shared/types';

// --- MUTATION: удалить сервер ---
export const useDeleteServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await serverAPI.deleteServer(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Server[]>(['servers'], (old) =>
        old?.filter((s) => s.id !== id)
      );
      qc.invalidateQueries({ queryKey: ['servers'] });
    },
  });
};
