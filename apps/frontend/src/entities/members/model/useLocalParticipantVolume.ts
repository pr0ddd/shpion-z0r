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
    setIsEnabled(!isEnabled);
    localStorage.setItem('isVolumeEnabled', String(!isEnabled));
    play();
  };

  return { isVolumeEnabled: isEnabled, toggleVolumeEnabled };
};
