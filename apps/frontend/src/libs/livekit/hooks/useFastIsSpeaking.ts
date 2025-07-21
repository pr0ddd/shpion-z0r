import { Participant } from 'livekit-client';
import { useSpeakingStore } from './useSpeakingStore';
import { useInstantIsSpeaking } from '@hooks/useInstantIsSpeaking';

export function useFastIsSpeaking(participant: Participant | undefined): boolean {
  if (!participant) return false;
  if (participant.isLocal) {
    return useInstantIsSpeaking(participant);
  }
  const remote = useSpeakingStore((s) => s.map[participant.sid]);
  return remote ?? participant.isSpeaking;
} 