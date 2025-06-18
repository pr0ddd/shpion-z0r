import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serverAPI } from '@shared/data';
import { Server } from '@shared/types';

// --- QUERY: список серверов ---
export const useServersQuery = () =>
  useQuery<Server[], Error>({
    queryKey: ['servers'],
    queryFn: async () => {
      const res = await serverAPI.getServers();
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Failed to fetch servers');
    },
    staleTime: 1000 * 60 * 5,
  });

// --- MUTATION: создать сервер ---
export const useCreateServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description?: string; icon?: string | null; sfuHost?: string; sfuPort?: number }) => await serverAPI.createServer(params),
    onSuccess: (res: any) => {
      if (!res.success || !res.data) return;
      qc.setQueryData<Server[]>(['servers'], (old) => (old ? [...old, res.data!] : [res.data!]));
      qc.invalidateQueries({ queryKey: ['servers'] });
    },
  });
};

// --- MUTATION: удалить сервер ---
export const useDeleteServer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await serverAPI.deleteServer(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Server[]>(['servers'], (old) => old?.filter((s) => s.id !== id));
      qc.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}; 