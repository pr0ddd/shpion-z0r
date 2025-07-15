/**
 * @deprecated
 * Doesn't work !!! 
 * @returns 
 */

import { useMemo } from 'react';
import { Track, Participant } from 'livekit-client';
import { TrackReference } from '@livekit/components-core';
import { useTrackVolume } from '@livekit/components-react';

/**
 * Instant speech detection without debounce/hold.
 * Returns true while participant's microphone audio level exceeds threshold.
 *
 * @param participant  LiveKit participant whose mic we analyse
 * @param threshold    RMS level (0..1) above which participant is considered speaking (default 0.02 ~ -46 dB)
 */
export function useInstantIsSpeaking(
  participant: Participant | undefined,
  threshold = 0.02,
): boolean {
  // Build TrackReference for participant's microphone so we can reuse LiveKit's audio analyser hook
  const micTrackRef: TrackReference | undefined = useMemo(() => {
    if (!participant) return undefined;
    return { participant, source: Track.Source.Microphone } as TrackReference;
  }, [participant]);

  // Raw volume value updated every `updateInterval` ms (20 ms by default)
  const volume = useTrackVolume(micTrackRef);

  // Convert numeric level to boolean flag
  return useMemo(() => volume > threshold, [volume, threshold]);
} 