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

  // initial bottom-right position
  const [pos, setPos] = useState(() => ({
    right: 10,
    bottom: 70,
  }));
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
      x: e.clientX - pos.right,
      y: window.innerHeight - e.clientY - pos.bottom,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [pos]);

  const onPointerMove = (e: PointerEvent) => {
    if (!dragOffset.current) return;
    const newLeft = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragOffset.current.x));
    const newBottom = Math.max(50, Math.min(window.innerHeight - 160, window.innerHeight - e.clientY - dragOffset.current.y));
    setPos({ right: newLeft, bottom: newBottom });
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
        bottom: pos.bottom,
        right: pos.right,
        zIndex: theme.zIndex.modal,
        width: 200,
        height: 120,
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
        onClick={(e) => {
          e.stopPropagation();
          setPreferredCamera(preferredCamera === 'front' ? 'back' : 'front');
        }}
      >
        <FlipCameraAndroidIcon fontSize="inherit" />
      </IconButton>
      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Box>
  );
}; 