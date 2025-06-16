import { useQuery } from '@tanstack/react-query';
import { serverAPI } from '@shared/data';
import { Server } from '@shared/types';

export const useServersQuery = () => {
  return useQuery<Server[], Error>({
    queryKey: ['servers'],
    queryFn: async () => {
      const res = await serverAPI.getServers();
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Failed to fetch servers');
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}; 