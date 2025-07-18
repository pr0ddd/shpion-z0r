import { useEffect, useRef } from 'react';
import { DataPacket_Kind, Participant, Room, RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { useInstantIsSpeaking } from '@hooks/useInstantIsSpeaking';
import { useSpeakingStore } from '../../hooks/useSpeakingStore';

export const SpeakingSync: React.FC = () => {
  const room = useRoomContext();
  const local = room?.localParticipant as Participant | undefined;
  const isSpeaking = useInstantIsSpeaking(local);
  const prevRef = useRef<boolean>(false);
  const setSpeaking = useSpeakingStore((s) => s.setSpeaking);

  // Publish local state on change
  useEffect(() => {
    if (!room || !local) return;
    if (isSpeaking === prevRef.current) return;
    prevRef.current = isSpeaking;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ on: isSpeaking }));
      room.localParticipant.publishData(payload, { reliable: false, topic: 'spk' });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, room, local]);

  // Listen for remote packets
  useEffect(() => {
    if (!room) return;
    const handler = (payload: Uint8Array, participant?: Participant, kind?: DataPacket_Kind, topic?: string) => {
      if (topic !== 'spk' || !participant) return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        setSpeaking(participant.sid, !!msg.on);
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, setSpeaking]);

  return null;
}; 