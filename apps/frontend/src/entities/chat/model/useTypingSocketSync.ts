import { useEffect } from 'react';
import { useSocket } from '@libs/socket';
import { useTypingStore } from './typing.store';

export const useTypingSocketSync = (serverId: string) => {
  const { socket } = useSocket();
  const setTyping = useTypingStore((s) => s.set);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: any) => {
      const { userId, serverId: sid, typing, username } = payload || {};
      if (sid !== serverId) return;
      setTyping(userId, username, typing);
    };
    socket.on('typing', handler as any);
    return () => {
      socket.off('typing', handler as any);
    };
  }, [socket, serverId, setTyping]);
}; 