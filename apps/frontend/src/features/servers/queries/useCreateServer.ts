import { serverAPI } from '@shared/data';
import { Server } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// --- MUTATION: создать сервер ---
export const useCreateServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      icon?: string | null;
      sfuHost?: string;
      sfuPort?: number;
    }) => await serverAPI.createServer(params),
    onSuccess: (res: any) => {
      if (!res.success || !res.data) return;
      qc.setQueryData<Server[]>(['servers'], (old) =>
        old ? [...old, res.data!] : [res.data!]
      );
      qc.invalidateQueries({ queryKey: ['servers'] });
    },
  });
};
