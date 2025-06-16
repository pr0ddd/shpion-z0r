import { useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCallback } from 'react';

export const useScreenShare = () => {
  const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });

  const toggle = useCallback(() => {
    if (buttonProps.onClick) buttonProps.onClick();
  }, [buttonProps]);

  return { toggle, enabled } as const;
}; 