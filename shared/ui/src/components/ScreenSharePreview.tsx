import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { TrackReference } from '@livekit/components-react';
import { useAppStore, useSocket, usePreviewStore } from '@shared/hooks';

interface ScreenSharePreviewProps {
  trackRef: TrackReference;
  width?: number;
  height?: number;
  staticImage?: boolean; // if true, fetch preview image via HTTP
}

/**
 * Renders a static preview (updated every couple seconds) of a screen-share track.
 * Draws frame on an offscreen canvas to avoid heavy <video> elements in list.
 */
export const ScreenSharePreview: React.FC<ScreenSharePreviewProps> = ({ trackRef, width, height, staticImage=false }) => {
  const boxW:any = width ?? '100%';
  const boxH:any = height ?? '100%';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { socket } = useSocket();
  const img = usePreviewStore(s=> s.previews[trackRef.publication.trackSid]);
  const setPreview = usePreviewStore(s=> s.setPreview);

  // when staticImage we just render <img> that reloads periodically
  if(staticImage){
    React.useEffect(()=>{
      const handler = (sid:string,dataUrl:string)=>{ setPreview(sid,dataUrl); };
      socket?.on?.('preview:update', handler);
      return ()=>{ socket?.off?.('preview:update', handler); };
    }, [socket, setPreview]);
    return (
      <Box sx={{ width: boxW, height: boxH, borderRadius:1, overflow:'hidden', bgcolor:'#000', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 0 4px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {img ? <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : null}
      </Box>
    );
  }

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