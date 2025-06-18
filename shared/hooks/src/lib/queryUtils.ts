import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { Message } from '@shared/types';

interface MessagesPage { messages: Message[]; hasMore: boolean; }

/**
 * Helper: patch first page of useInfiniteMessagesQuery cache.
 * Pass updater that receives current messages array and returns new array.
 */
export function patchFirstMessagesPage(
  qc: QueryClient,
  serverId: string,
  updater: (msgs: Message[]) => Message[],
): void {
  qc.setQueryData<InfiniteData<MessagesPage>>(['messages', serverId], (old) => {
    if (!old) return old;
    const first = old.pages[0];
    return {
      ...old,
      pages: [{ ...first, messages: updater(first.messages) }, ...old.pages.slice(1)],
    } as InfiniteData<MessagesPage>;
  });
} 