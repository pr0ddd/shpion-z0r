import { useRoomContext, useTracks } from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import { useEffect } from 'react';

interface LiveKitRoomConsumerProps {
  onStatusChange: (connected: boolean) => void;
}

export const LiveKitRoomConsumer: React.FC<LiveKitRoomConsumerProps> = ({
  onStatusChange,
}) => {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;
    const handleConnected = () => onStatusChange(true);
    const handleReconnecting = () => onStatusChange(false);
    const handleReconnected = () => onStatusChange(true);

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [room]);

  return null;
};
