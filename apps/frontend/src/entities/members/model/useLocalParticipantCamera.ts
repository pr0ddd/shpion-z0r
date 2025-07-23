import { useLocalParticipant } from '@livekit/components-react';

export const useLocalParticipantCamera = () => {
  const { localParticipant } = useLocalParticipant();

  const isCameraEnabled = localParticipant?.isCameraEnabled;
  const toggleCameraEnabled = () => {
    localParticipant?.setCameraEnabled(!isCameraEnabled);
  };

  return { isCameraEnabled, toggleCameraEnabled };
};
