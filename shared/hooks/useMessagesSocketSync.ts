import { useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useSocket, useAppStore } from '@shared/hooks';
import { Message } from '@shared/types';

interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Listens to socket 'message:new' events and appends them to the last page
 * of useInfiniteMessagesQuery cache so UI updates in real-time.
 */
export const useMessagesSocketSync = () => {
  const { socket } = useSocket();
  const qc = useQueryClient();
  const serverId = useAppStore((s) => s.selectedServerId);

  useEffect(() => {
    if (!socket || !serverId) return;

    const add = (msg: Message) => {
      if (msg.serverId !== serverId) return;
      qc.setQueryData<InfiniteData<MessagesPage>>(['messages', serverId], (old) => {
        if (!old) return old;
        const firstPageIdx = 0;
        let { messages: firstMsgs } = old.pages[firstPageIdx];

        // remove optimistic temp duplicates
        firstMsgs = firstMsgs.filter(
          (m) => !(m.id.startsWith('temp_') && m.content === msg.content && m.authorId === msg.authorId),
        );

        // skip if real already present
        if (firstMsgs.some((m) => m.id === msg.id)) return old;

        const updatedFirstPage = {
          ...old.pages[firstPageIdx],
          messages: [...firstMsgs, msg],
        };

        const pages = [...old.pages];
        pages[firstPageIdx] = updatedFirstPage;
        return { ...old, pages } as InfiniteData<MessagesPage>;
      });
    };

    socket.on('message:new', add as any);
    return () => {
      socket.off('message:new', add as any);
    };
  }, [socket, qc, serverId]);
}; 