import { useLocalParticipant } from '@livekit/components-react';
import { useToggleFeedbackSound } from './useToggleFeedbackSound';
import { useEffect } from 'react';

export const useLocalParticipantMic = () => {
  const { localParticipant } = useLocalParticipant();
  const { play } = useToggleFeedbackSound();

  const isMicEnabled = localParticipant?.isMicrophoneEnabled;

  // Apply saved mic preference
  useEffect(() => {
    if (!localParticipant) return;

    const saved = localStorage.getItem('isMicEnabled');
    if (saved === null) return;
    const desired = saved === 'true';
    const current = localParticipant.isMicrophoneEnabled;
    if (desired !== current) localParticipant.setMicrophoneEnabled(desired);
  }, [])

  const toggleMicEnabled = () => {
    localParticipant?.setMicrophoneEnabled(!isMicEnabled);
    localStorage.setItem('isMicEnabled', String(!isMicEnabled));
    play();
  };

  return { isMicEnabled, toggleMicEnabled };
};
