import { useEffect } from 'react';
import { useSocket } from '@libs/socket';
import { Message } from '@shared/types';
import { useSessionStore } from '@entities/session';
import { useListeningStore } from './listening.store';
import { useUnreadStore } from './unread.store';

/**
 * Listens for new messages via socket and increments unread counter
 * whenever the user is NOT actively listening to the chat (scrolled
 * to bottom & chat visible). Lives outside chat panel so continues to
 * count even when the chat accordion is collapsed.
 */
export const useUnreadSocketSync = (serverId?: string) => {
  const { socket } = useSocket();
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    if (!socket || !serverId) return;

    // Join server room once when mounted
    socket.emit('server:join', serverId);

    const handler = (msg: Message) => {
      if (msg.serverId !== serverId) return;
      if (msg.authorId === user?.id) return; // ignore own

      const isListening = useListeningStore.getState().isListening(serverId);
      if (!isListening) {
        useUnreadStore.getState().inc(serverId);
      }
    };

    socket.on('message:new', handler as any);
    return () => {
      // Do not emit 'server:leave' here: unmounts can occur during responsive layout changes
      // which would wrongly trigger "user:left" sounds.
      socket.off('message:new', handler as any);
    };
  }, [socket, serverId, user?.id]);
}; 