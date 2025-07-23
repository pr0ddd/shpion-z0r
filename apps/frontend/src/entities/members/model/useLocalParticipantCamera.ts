import { useLocalParticipant } from '@livekit/components-react';
import { useSystemSettingsStore } from '@entities/systemSettings';
import { useCameraSettingsStore } from './cameraSettings.store';

export const useLocalParticipantCamera = () => {
  const { localParticipant } = useLocalParticipant();
  const preferredCamera = useCameraSettingsStore((s) => s.preferredCamera);
  // Pull default video capture settings from global system settings (the same values used when initially joining the room).
  const videoCaptureDefaults =
    useSystemSettingsStore((s) => s.roomOptions?.videoCaptureDefaults);

  const isCameraEnabled = localParticipant?.isCameraEnabled;
  const toggleCameraEnabled = async () => {
    if (!localParticipant) return;
    
    const enable = !localParticipant.isCameraEnabled;
    
    try {
      // LiveKit may throw "invalid uint 32: NaN" when width/height are missing from
      // the constraint object (see https://github.com/livekit/livekit/issues/2924).
      // To avoid this, always provide an explicit resolution alongside the optional
      // mobile facing-mode constraint.

      const isMobile = window.innerWidth < 768;

      let mobileConstraints: Record<string, any> = {};
      if (enable) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === 'videoinput');
          let targetCam;
          if (preferredCamera === 'front') {
            targetCam = cams.find((d) => /front/i.test(d.label)) ?? cams[0];
            mobileConstraints.facingMode = 'user' as const;
          } else {
            targetCam = cams.find((d) => /back|rear|environment/i.test(d.label)) ?? cams[0];
            mobileConstraints.facingMode = 'environment' as const;
          }
          if (targetCam) {
            mobileConstraints.deviceId = { exact: targetCam.deviceId } as const;
          }
        } catch {
          mobileConstraints.facingMode = preferredCamera === 'front' ? 'user' : 'environment';
        }
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      const resolutionPart = !isIOS && videoCaptureDefaults?.resolution
        ? {
            width: Number(videoCaptureDefaults.resolution.width),
            height: Number(videoCaptureDefaults.resolution.height),
            frameRate:
              videoCaptureDefaults.resolution.frameRate !== undefined
                ? Number(videoCaptureDefaults.resolution.frameRate)
                : undefined,
          }
        : {};

      const opts = enable ? { ...resolutionPart, ...mobileConstraints } : undefined;
      
      console.log('toggleCameraEnabled opts', opts);
      await localParticipant.setCameraEnabled(enable, opts);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  return { isCameraEnabled, toggleCameraEnabled };
};
