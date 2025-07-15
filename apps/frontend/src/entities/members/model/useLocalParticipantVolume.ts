import { useEffect, useState } from 'react';
import { useToggleFeedbackSound } from './useToggleFeedbackSound';
import { useParticipantMetadata } from './useLocalParticipantMetadata';
import { useLocalParticipant } from '@livekit/components-react';

export const useLocalParticipantVolume = () => {
  const { localParticipant } = useLocalParticipant();
  const { updateMetadata } = useParticipantMetadata(localParticipant);
  const { play } = useToggleFeedbackSound();

  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('isVolumeEnabled') === 'true'
  );

  // Синхронизация между разными экземплярами хука через CustomEvent
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setIsEnabled(detail);
    };
    window.addEventListener('volume-changed', handler as EventListener);
    return () => window.removeEventListener('volume-changed', handler as EventListener);
  }, []);

  useEffect(() => {
    // console.log({
    //   localParticipant: localParticipant?.name,
    //   isEnabled
    // })
    updateMetadata({
      volumeOn: isEnabled ? true : false,
    })
  }, [isEnabled])

  const toggleVolumeEnabled = () => {
    const newVal = !isEnabled;
    setIsEnabled(newVal);
    localStorage.setItem('isVolumeEnabled', String(newVal));
    // распространяем событие, чтобы другие компоненты обновились
    window.dispatchEvent(new CustomEvent('volume-changed', { detail: newVal }));
    play();
  };

  return { isVolumeEnabled: isEnabled, toggleVolumeEnabled };
};
