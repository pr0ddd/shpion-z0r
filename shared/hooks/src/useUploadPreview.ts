import { useEffect } from 'react';
import { TrackReference } from '@livekit/components-react';
import { useSocket } from './contexts/SocketContext';
import { usePreviewStore } from './store/usePreview';

export const useUploadPreview = (trackRef: TrackReference | null, intervalMs = 2000) => {
  const { socket } = useSocket();
  const setPreview = usePreviewStore((s)=> s.setPreview);

  useEffect(() => {
    if (!trackRef || !trackRef.publication?.track) return;
    const trackSid = trackRef.publication.trackSid;
    const videoEl = document.createElement('video');
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.style.position = 'absolute';
    videoEl.style.left = '-9999px';
    document.body.appendChild(videoEl);

    trackRef.publication.track.attach(videoEl);
    videoEl.play().catch(()=>{});

    const canvas = document.createElement('canvas');

    const sendFrame = async () => {
      if (!videoEl.videoWidth) return;
      // Downscale to keep payload small (max 320px on longer side)
      const maxDim = 320;
      const ratio = Math.min(1, maxDim / Math.max(videoEl.videoWidth, videoEl.videoHeight));
      const w = Math.round(videoEl.videoWidth * ratio);
      const h = Math.round(videoEl.videoHeight * ratio);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setPreview(trackSid, dataUrl);
          socket?.emit?.('preview:update', trackSid, dataUrl);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.5);
    };

    const id = setInterval(sendFrame, intervalMs);
    // send first frame once available
    const wait = () => { if (videoEl.videoWidth) sendFrame(); else requestAnimationFrame(wait);};
    wait();

    return () => {
      clearInterval(id);
      trackRef.publication?.track?.detach(videoEl);
      videoEl.remove();
    };
  }, [trackRef]);
}; 