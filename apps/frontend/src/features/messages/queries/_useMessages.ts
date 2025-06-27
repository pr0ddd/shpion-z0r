import { useQuery } from '@tanstack/react-query';
import { messageAPI } from '@shared/data';
import { Message } from '@shared/types';

/**
 * Получить сообщения сервера. Если serverId null, запрос не выполняется.
 */
export const useMessagesQuery = (serverId: string | null) =>
  useQuery<Message[], Error>({
    queryKey: ['messages', serverId],
    enabled: !!serverId,
    queryFn: async () => {
      const res = await messageAPI.getMessages(serverId!);
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Failed to fetch messages');
    },
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  }); 