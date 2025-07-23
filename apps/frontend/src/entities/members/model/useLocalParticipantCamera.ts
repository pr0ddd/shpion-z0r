import { useLocalParticipant } from '@livekit/components-react';
import { VideoCaptureOptions } from 'livekit-client';

export const useLocalParticipantCamera = () => {
  const { localParticipant } = useLocalParticipant();

  const isCameraEnabled = localParticipant?.isCameraEnabled;
  const toggleCameraEnabled = async () => {
    if (!localParticipant) return;
    if (isCameraEnabled) {
      localParticipant.setCameraEnabled(false);
      return;
    }

    const highRes: VideoCaptureOptions = {
      resolution: { width: 2560, height: 1440 },
    };

    try {
      await localParticipant.setCameraEnabled(true, highRes);
    } catch (err) {
      console.warn('[Camera] not supported, falling back', err);
      await localParticipant.setCameraEnabled(true);
    }
  };

  return { isCameraEnabled, toggleCameraEnabled };
};
