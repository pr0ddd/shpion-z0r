import { useCallback, useEffect, useSyncExternalStore, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { useServerStore } from '@entities/server/model';

import { ScreenShareManager } from './screenShareManager';

const manager = new ScreenShareManager();

export const useScreenShare = () => {
  const selectedServer = useServerStore((s) => s.selectedServerId);
  const room = useRoomContext();

  const enabled = useSyncExternalStore(manager.subscribe.bind(manager), () =>
    manager.isEnabled()
  );
  const sharesStr = useSyncExternalStore(manager.subscribe.bind(manager), () =>
    manager.list().join('|')
  );
  const shares = sharesStr
    ? sharesStr.split('|').filter(Boolean).map(Number)
    : [];

  const startNew = useCallback(
    (userId: string) => {
      if (!selectedServer || !room) return;
      void manager.start(room, userId);
    },
    [selectedServer, room]
  );

  const stopShare = useCallback((idx: number) => {
    manager.stop(idx);
  }, []);

  const stopAll = useCallback(() => {
    manager.stop();
  }, []);

  // Авто-остановка всех локальных шэров при выходе из комнаты
  useEffect(() => {
    if (!room) return;
    const handleDisconnect = () => manager.stop();
    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room]);

  // Если пользователь сменил комнату (room объект поменялся), прекращаем все локальные шэринги,
  // чтобы счётчик корректно обнулился и треки не остались висеть в старой комнате.
  const prevRoomRef = useRef<Room | null>(null);
  useEffect(() => {
    if (prevRoomRef.current && room && prevRoomRef.current !== room) {
      manager.stop();
    }
    prevRoomRef.current = room ?? null;
  }, [room]);

  // Остановка всех шэрингов, когда компонент с хуком размонтируется (смена комнаты / выход).
  useEffect(() => {
    return () => {
      manager.stop();
    };
  }, []);

  return {
    enabled,
    shares,
    count: manager.count,
    startNew,
    stopShare,
    stopAll,
  } as const;
};
