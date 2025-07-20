import { Message, MessagesPage } from '@shared/types';
import { InfiniteData, QueryClient } from '@tanstack/react-query';

/**
 * Helper: remove a message from the useInfiniteMessagesQuery cache
 */
export const removeMessageFromCache = (
  qc: QueryClient,
  serverId: string,
  messageId: string
): void => {
  qc.setQueryData<InfiniteData<MessagesPage>>(['messages', serverId], (old) => {
    if (!old) return old;
    const pages = old.pages.map((p) => ({
      ...p,
      messages: p.messages.filter((m: Message) => m.id !== messageId),
    }));
    return { ...old, pages } as InfiniteData<MessagesPage>;
  });
}; 