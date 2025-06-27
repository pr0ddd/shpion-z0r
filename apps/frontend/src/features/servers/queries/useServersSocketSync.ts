import { useEffect } from 'react';
import { useSocket } from '@features/socket';
import { useQueryClient } from '@tanstack/react-query';
import { Server } from '@shared/types';

/**
 * Подписывается на socket события server:updated / server:deleted
 * и аккуратно патчит кэш React-Query ['servers'].
 */
export const useServersSocketSync = () => {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const onUpdated = (srv: Server) => {
      qc.setQueryData<Server[]>(['servers'], (old) =>
        old?.map((s) => (s.id === srv.id ? { ...s, ...srv } : s)),
      );
    };

    const onDeleted = (srvId: string) => {
      qc.setQueryData<Server[]>(['servers'], (old) => old?.filter((s) => s.id !== srvId));
    };

    socket.on('server:updated', onUpdated);
    socket.on('server:deleted', onDeleted);
    return () => {
      socket.off('server:updated', onUpdated);
      socket.off('server:deleted', onDeleted);
    };
  }, [socket, qc]);
}; 