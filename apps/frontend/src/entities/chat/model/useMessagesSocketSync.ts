import { useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { Message } from '@shared/types';

import { useSocket } from '@libs/socket';
import { removeMessageFromCache } from '../api/removeMessageFromCache';

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

    // (room join happens in higher-level hooks; avoid duplicate joins)
    // socket.emit('server:join', serverId);

    const add = (msg: Message & { clientNonce?: string }) => {
      if (msg.serverId !== serverId) return;
      qc.setQueryData<InfiniteData<MessagesPage>>(['messages', serverId], (old) => {
        if (!old) return old;
        const firstPageIdx = 0;
        const pagesCopy = [...old.pages];
        const first = { ...pagesCopy[firstPageIdx] };
        let msgs = [...first.messages];

        // 1. Attempt to replace optimistic temp message using clientNonce
        let replaced = false;
        if (msg.clientNonce) {
          const tempId = `temp_${msg.clientNonce}`;
          msgs = msgs.map((m) => {
            if (m.id === tempId) {
              replaced = true;
              return { ...msg } as Message;
            }
            return m;
          });
        }

        if (!replaced) {
          // 2. Remove any remaining dupes (same content & author) & bot placeholders
          msgs = msgs.filter((m) => {
            if (m.id.startsWith('ollama_')) return false;
            if (
              m.id.startsWith('temp_') &&
              m.content === msg.content &&
              m.authorId === msg.authorId
            ) {
              return false;
            }
            return true;
          });

          // skip if real already present
          if (msgs.some((m) => m.id === msg.id)) {
            return old;
          }

          msgs.push(msg as Message);
        }

        first.messages = msgs;
        pagesCopy[firstPageIdx] = first;
        return { ...old, pages: pagesCopy } as InfiniteData<MessagesPage>;
      });
      // Unread counting moved to global hook
    };

    const update = (msg: Message) => {
      if(msg.serverId!==serverId) return;
      qc.setQueryData<InfiniteData<MessagesPage>>(['messages', serverId], old=>{
        if(!old) return old;
        const first = old.pages[0];
        const updatedPage = { ...first, messages: first.messages.map(m=>m.id===msg.id?msg:m)};
        return { ...old, pages: [updatedPage, ...old.pages.slice(1)] } as InfiniteData<MessagesPage>;
      });
    };

    const remove = (messageId: string, sId: string) => {
      if (sId !== serverId) return;
      removeMessageFromCache(qc, serverId, messageId);
    };

    socket.on('message:new', add as any);
    socket.on('message:updated', update as any);
    socket.on('message:deleted', remove as any);
    return () => {
      socket.off('message:new', add as any);
      socket.off('message:updated', update as any);
      socket.off('message:deleted', remove as any);
      // Do not emit 'server:leave' here to avoid leaving the room when the
      // chat panel is closed. `StreamActive` (video player) maintains its own
      // join/leave lifecycle tied to the page, guaranteeing мы stay in the
      // room while the server page is open and leave automatically when the
      // user navigates away.
    };
  }, [socket, qc, serverId]);
}; 