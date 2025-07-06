import { messageAPI } from '@shared/data';
import { MessagesPage } from '@shared/types';
import {
  QueryFunctionContext,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

const PAGE_SIZE = 50;

const fetchMessages = async ({ queryKey, pageParam }: QueryFunctionContext) => {
  const [, serverId] = queryKey as [string, string];
  const res = await messageAPI.getMessages(
    serverId,
    pageParam as string | undefined
  );
  if (res.success && res.data) {
    const msgs = res.data;
    return {
      messages: msgs,
      hasMore: msgs.length === PAGE_SIZE,
    } as MessagesPage;
  }
  throw new Error(res.error || 'Failed to load messages');
};

export const useMessagesQuery = (serverId: string) => {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MessagesPage, Error>({
    queryKey: ['messages', serverId],
    initialPageParam: undefined,
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.messages.length > 0
        ? lastPage.messages[0].createdAt
        : undefined,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
