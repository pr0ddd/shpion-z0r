import { useCallback } from 'react';
import { serverAPI } from '@shared/data';
import { useAppStore } from '@stores/useAppStore';
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
  const { startTransition, endTransition, setSelected } = useAppStore()

  const { socket } = useSocket();

  return useCallback(
    async (serverId: string | null) => {
      if (!serverId) {
        const prevId = useAppStore.getState().selectedServerId;
        if (socket?.connected && prevId) {
          socket.emit('server:leave', prevId);
        }
        setSelected(null);
        return;
      }

      startTransition();
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
      } catch (error) {
        console.error(error);
      } finally {
        endTransition();
      }
    },
    [qc, socket],
  );
}; 