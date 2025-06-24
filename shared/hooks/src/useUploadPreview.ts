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
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
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