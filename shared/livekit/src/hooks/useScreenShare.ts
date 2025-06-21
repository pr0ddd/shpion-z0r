import { useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCallback } from 'react';

// Simplified: rely on LiveKit helper but request audio together with video
export const useScreenShare = () => {
  const { toggle: innerToggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });

  const toggle = useCallback(() => {
    if (enabled) {
      void innerToggle(false);
    } else {
      void innerToggle(true, { audio: true, contentHint: 'motion' } as any);
    }
  }, [enabled, innerToggle]);

  return { toggle, enabled } as const;
}; 