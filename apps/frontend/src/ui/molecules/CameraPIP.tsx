import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface CameraPIPProps {
  visible?: boolean;
}

export const CameraPIP: React.FC<CameraPIPProps> = ({ visible = true }) => {
  const theme = useTheme();
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);

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
      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Box>
  );
}; 