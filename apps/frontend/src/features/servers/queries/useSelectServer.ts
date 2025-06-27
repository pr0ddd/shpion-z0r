import { useCallback } from 'react';
import { serverAPI } from '@shared/data';
import { useAppStore } from '../../../stores/useAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@features/socket';

/**
 * Возвращает функцию selectServer(id, name) — единая точка смены сервера.
 * 1. Включает overlay.
 * 2. Запрашивает участников и LiveKit token.
 * 3. Подключается к LiveKit, ждёт RoomEvent.Connected.
 * 4. Выключает overlay.
 */
export const useSelectServer = () => {
  const qc = useQueryClient();
  // Access actions lazily to avoid unnecessary subscriptions
  const getActions = () => {
    const { startTransition, endTransition, setSelected } = useAppStore.getState();
    return { startTransition, endTransition, setSelected };
  };

  const { socket } = useSocket();

  return useCallback(
    async (serverId: string | null, serverName?: string) => {
      if (!serverId) {
        const prevId = useAppStore.getState().selectedServerId;
        if (socket?.connected && prevId) {
          socket.emit('server:leave', prevId);
        }
        getActions().setSelected(null);
        return;
      }

      const { startTransition, setSelected, endTransition } = getActions();
      startTransition(`Переходим на сервер «${serverName ?? ''}» …`);
      setSelected(serverId);

      // join socket room for messages
      if(socket?.connected){
        socket.emit('server:join', serverId);
      }

      localStorage.setItem('lastSelectedServerId', serverId);

      try {
        const { success: mOk, data: members } = await serverAPI.getServerMembers(serverId);

        if (mOk && members) {
          // Кэшируем членов, если нужен отдельный query
          qc.setQueryData(['members', serverId], members);
        }
      } finally {
        getActions().endTransition();
      }
    },
    [qc, socket],
  );
}; 