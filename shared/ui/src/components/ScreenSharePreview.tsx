import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { TrackReference } from '@livekit/components-react';
import { useAppStore } from '@shared/hooks';

interface ScreenSharePreviewProps {
  trackRef: TrackReference;
  width?: number; // px
  height?: number; // px
}

/**
 * Renders a static preview (updated every couple seconds) of a screen-share track.
 * Draws frame on an offscreen canvas to avoid heavy <video> elements in list.
 */
export const ScreenSharePreview: React.FC<ScreenSharePreviewProps> = ({ trackRef, width = 80, height = 45 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedServerId = useAppStore((s) => s.selectedServerId);

  // attach video track (hidden) once
  useEffect(() => {
    if (!trackRef?.publication?.track) return;

    const videoEl = document.createElement('video');
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.style.position = 'absolute';
    videoEl.style.left = '-9999px'; // off-screen
    videoEl.style.width = `${width}px`;
    videoEl.style.height = `${height}px`;
    document.body.appendChild(videoEl);

    trackRef.publication.track.attach(videoEl);
    videoEl.play().catch(() => {});

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !videoEl.videoWidth) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return true;
    };

    // fast attempt loop until first frame is available
    const waitForFirstFrame = () => {
      if (draw()) {
        // after first successful draw switch to slower interval
        intervalRef.current = setInterval(draw, 1500);
      } else {
        requestAnimationFrame(waitForFirstFrame);
      }
    };

    waitForFirstFrame();

    return () => {
      trackRef.publication?.track?.detach(videoEl);
      videoEl.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trackRef, width, height]);

  const handlePopout = () => {
    if (!selectedServerId) return;
    const url = `${window.location.origin}/stream/${selectedServerId}/${trackRef.publication.trackSid}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width, height, borderRadius: 1, overflow: 'hidden', bgcolor: '#000', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 4px rgba(0,0,0,0.4)' }}>
        <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
};

export default ScreenSharePreview; 