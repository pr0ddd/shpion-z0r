/**
 * @deprecated use useMessagesQuery instead
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { messageAPI } from '@shared/data';
import { Message } from '@shared/types';

const PAGE_SIZE = 50;

interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Infinite paginated messages for chat. Fetches newest PAGE_SIZE messages first,
 * then older ones using `before` cursor (ISO date), keeping previous data.
 */
export const useInfiniteMessagesQuery = (serverId: string | null) =>
  useInfiniteQuery<MessagesPage, Error>({
    queryKey: ['messages', serverId],
    enabled: !!serverId,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      if (!serverId) throw new Error('serverId is required');
      const res = await messageAPI.getMessages(serverId, pageParam as string | undefined);
      if (res.success && res.data) {
        const msgs = res.data;
        return {
          messages: msgs,
          hasMore: msgs.length === PAGE_SIZE,
        } as MessagesPage;
      }
      throw new Error(res.error || 'Failed to load messages');
    },
    // return the createdAt of the earliest message of last page as next cursor
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.messages.length > 0
        ? lastPage.messages[0].createdAt
        : undefined,
    refetchOnWindowFocus: false,
  }); 