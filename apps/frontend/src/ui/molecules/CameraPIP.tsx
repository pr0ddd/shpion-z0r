import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCameraSettingsStore } from '@entities/members/model';

interface CameraPIPProps {
  visible?: boolean;
}

export const CameraPIP: React.FC<CameraPIPProps> = ({ visible = true }) => {
  const theme = useTheme();
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);

  const preferredCamera = useCameraSettingsStore((s) => s.preferredCamera);
  const setPreferredCamera = useCameraSettingsStore((s) => s.setPreferredCamera);

  /**
   * Try to pick a deviceId that matches desired facing.
   * On most mobile browsers, device labels contain words like 'front', 'user', 'back', 'rear', 'environment'.
   * Fallback: choose first (front) or second (back) camera.
   */
  const getDeviceIdForFacing = useCallback(async (facing: 'front' | 'back') => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      if (!cams.length) return undefined;
      const keywords = facing === 'front' ? ['front', 'user'] : ['back', 'rear', 'environment'];
      for (const key of keywords) {
        const found = cams.find((d) => d.label.toLowerCase().includes(key));
        if (found) return found.deviceId;
      }
      // Fallback to position in list: assumption first = front, second = back
      if (facing === 'front') return cams[0].deviceId;
      if (cams.length > 1) return cams[1].deviceId;
      return cams[0].deviceId; // only one camera
    } catch (e) {
      console.warn('[CameraPIP] Failed to enumerate devices', e);
      return undefined;
    }
  }, []);

  // --- Draggable position (left / top) ---
  const WIDTH = 260;
  const HEIGHT = 160;

  const [pos, setPos] = useState(() => ({
    left: typeof window !== 'undefined' ? window.innerWidth - WIDTH - 10 : 10,
    top: typeof window !== 'undefined' ? window.innerHeight - HEIGHT - 70 : 70,
  }));

  // Pointer offset inside the box when dragging starts
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  // Set media track when visible toggles
  useEffect(() => {
    if (!visible || !videoRef.current) {
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    const camPub = localParticipant?.getTrackPublication(Track.Source.Camera);
    const mediaTrack = camPub?.track?.mediaStreamTrack as MediaStreamTrack | undefined;
    if (mediaTrack) {
      const stream = new MediaStream([mediaTrack]);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [visible, localParticipant]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragOffset.current = {
      x: e.clientX - pos.left,
      y: e.clientY - pos.top,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [pos]);

  const onPointerMove = (e: PointerEvent) => {
    if (!dragOffset.current) return;

    const newLeft = Math.max(0, Math.min(window.innerWidth - WIDTH, e.clientX - dragOffset.current.x));
    const newTop = Math.max(0, Math.min(window.innerHeight - HEIGHT, e.clientY - dragOffset.current.y));
    setPos({ left: newLeft, top: newTop });
  };

  const onPointerUp = () => {
    dragOffset.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  if (!visible) return null;

  return (
    <Box
      onPointerDown={onPointerDown}
      sx={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: theme.zIndex.modal,
        width: WIDTH,
        height: HEIGHT,
        borderRadius: 2,
        overflow: 'hidden',
        border: '2px solid',
        borderColor: 'primary.main',
        backgroundColor: 'black',
        touchAction: 'none',
        cursor: 'move',
      }}
    >
      {/* Switch camera button */}
      <IconButton
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'common.white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          zIndex: 1,
        }}
        onClick={async (e) => {
          e.stopPropagation();
          if (!localParticipant) return;

          const newFacing = preferredCamera === 'front' ? 'back' : 'front';

          // Disable current camera first to stop existing track
          try {
            await localParticipant.setCameraEnabled(false);
          } catch {}

          const deviceId = await getDeviceIdForFacing(newFacing);
          try {
            const opts = deviceId
              ? { deviceId }
              : { facingMode: newFacing === 'front' ? 'user' : 'environment' };
            // @ts-ignore: LiveKit typings accept VideoCaptureOptions, string is deprecated
            await localParticipant.setCameraEnabled(true, opts as any);
          } catch (err) {
            console.warn('[CameraPIP] Failed to switch camera', err);
          }

          setPreferredCamera(newFacing);
        }}
      >
        <FlipCameraAndroidIcon fontSize="inherit" />
      </IconButton>
      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Box>
  );
}; 