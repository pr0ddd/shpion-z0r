import { useQuery } from '@tanstack/react-query';
import { serverAPI } from '@shared/data';
import { Member } from '@shared/types';

/**
 * Получить участников сервера. Если serverId = null, запрос не выполняется.
 */
export const useMembersQuery = (serverId: string | null) => {
  return useQuery<Member[], Error>({
    queryKey: ['members', serverId],
    enabled: !!serverId,
    queryFn: async () => {
      const res = await serverAPI.getServerMembers(serverId!);
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Failed to fetch members');
    },
    staleTime: 1000 * 30,
  });
}; 