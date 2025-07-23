import { useLocalParticipant } from '@livekit/components-react';

export const useLocalParticipantCamera = () => {
  const { localParticipant } = useLocalParticipant();

  const isCameraEnabled = localParticipant?.isCameraEnabled;
  const toggleCameraEnabled = () => {
    if (!localParticipant) return;
    if (isCameraEnabled) {
      localParticipant.setCameraEnabled(false);
    } else {
      localParticipant.setCameraEnabled(true, {
        resolution: { width: 1280, height: 720 },
      } as any);
    }
  };

  return { isCameraEnabled, toggleCameraEnabled };
};
