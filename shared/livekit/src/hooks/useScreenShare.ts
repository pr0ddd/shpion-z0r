import { useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCallback } from 'react';

// Simplified: rely on LiveKit helper but request audio together with video
export const useScreenShare = () => {
  const { toggle: innerToggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });

  const toggle = useCallback(() => {
    if (enabled) {
      void innerToggle(false).catch((err:any)=>{
        console.error('Disable screenshare failed',err);
      });
      return;
    }

    // First attempt: with system audio
    innerToggle(true, { audio: true } as any).catch((err: any) => {
      console.warn('Screen share with audio failed, retrying without audio:', err);
      // Try again without audio
      innerToggle(true).catch((err2: any) => {
        console.error('Screen share failed:', err2);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('screen-share-error', { detail: err2 }));
        }
      });
    });
  }, [enabled, innerToggle]);

  return { toggle, enabled } as const;
}; 