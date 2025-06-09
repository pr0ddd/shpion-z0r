import React, { useEffect } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';

export const RoomInitialActions = ({ children }: { children: React.ReactNode }) => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const handleInitialSetup = async () => {
      if (room && localParticipant) {
        // Устанавливаем микрофон в выключенное состояние по умолчанию
        await localParticipant.setMicrophoneEnabled(false);
      }
    };
    
    // Подписываемся на событие подключения
    room.on('connected', handleInitialSetup);

    // Убедимся, что если мы уже подключены, то выполним настройку
    if (room.state === 'connected') {
      handleInitialSetup();
    }
    
    // Отписка от события при размонтировании
    return () => {
      room.off('connected', handleInitialSetup);
    };
  }, [room, localParticipant]);

  return <>{children}</>;
}; 