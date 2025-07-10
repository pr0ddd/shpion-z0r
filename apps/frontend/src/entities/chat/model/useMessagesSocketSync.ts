import { useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { Message } from '@shared/types';

import { useSocket } from '@libs/socket';

interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Listens to socket 'message:new' events and appends them to the last page
 * of useInfiniteMessagesQuery cache so UI updates in real-time.
 */
export const useMessagesSocketSync = (serverId: string) => {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !serverId) return;

    // join server room to receive real-time events
    // socket.emit('server:join', serverId);

    const add = (msg: Message) => {
      if (msg.serverId !== serverId) return;
      qc.setQueryData<InfiniteData<MessagesPage>>(['messages', serverId], (old) => {
        if (!old) return old;
        const firstPageIdx = 0;
        let { messages: firstMsgs } = old.pages[firstPageIdx];

        // remove optimistic temp duplicates
        firstMsgs = firstMsgs.filter((m) => {
          if (m.id.startsWith('temp_') && m.content === msg.content && m.authorId === msg.authorId) {
            return false;
          }
          // remove bot thinking placeholders
          if (m.id.startsWith('ollama_')) {
            return false;
          }
          return true;
        });

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
      // Do not emit 'server:leave' here to avoid leaving the room when the
      // chat panel is closed. `StreamActive` (video player) maintains its own
      // join/leave lifecycle tied to the page, guaranteeing we stay in the
      // room while the server page is open and leave automatically when the
      // user navigates away.
    };
  }, [socket, qc, serverId]);
}; 