import { useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCallback } from 'react';

export const useScreenShare = () => {
  const { toggle: innerToggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });

  const toggle = useCallback(() => {
    if (enabled) {
      void innerToggle(false);
    } else {
      void innerToggle(true, { contentHint: 'motion' } as any);
    }
  }, [innerToggle, enabled]);

  return { toggle, enabled } as const;
}; 