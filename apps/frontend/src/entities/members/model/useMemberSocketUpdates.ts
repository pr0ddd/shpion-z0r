import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Member } from '@shared/types';
import { useSocket } from '@libs/socket/useSocket';

export const useMemberSocketUpdates = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handler = (member: Member, serverId: string) => {
      queryClient.setQueryData<Member[]>(['members', serverId], (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === member.id ? member : m));
      });
    };

    socket.on('user:updated', handler);
    return () => {
      socket.off('user:updated', handler);
    };
  }, [socket]);
}; 