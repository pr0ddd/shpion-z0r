import { useMemo, useEffect, useRef, useState } from 'react';
import { Track, Participant, ParticipantEvent } from 'livekit-client';
import { TrackReference } from '@livekit/components-core';
import { useTrackVolume } from '@livekit/components-react';

/**
 * Low-latency speech detection.
 *
 * Unlike LiveKit's built-in `useIsSpeaking`, this hook reacts almost instantly
 * (≈ `updateInterval` ms) and keeps the flag for only `holdMs` after speech
 * stops, eliminating long tail delays.
 *
 * @param participant  Participant whose microphone track is analysed
 * @param threshold    RMS level (0..1) above which participant is considered speaking
 * @param holdMs       How long to keep `true` after level drops below threshold
 */
export function useInstantIsSpeaking(
  participant: Participant | undefined,
  holdMs = 120,
): boolean {
  // 1. Build TrackReference for LiveKit analyser helper
  const micTrackRef: TrackReference | undefined = useMemo(() => {
    if (!participant) return undefined;
    return { participant, source: Track.Source.Microphone } as TrackReference;
  }, [participant]);

  // 2. Subscribe to LiveKit's speaking events for immediate feedback.
  const [eventSpeaking, setEventSpeaking] = useState<boolean>(false);

  useEffect(() => {
    if (!participant) return;
    const onSpeakingChanged = (speaking: boolean) => {
      setEventSpeaking(speaking);
    };
    participant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
    // init
    setEventSpeaking(participant.isSpeaking);
    return () => {
      participant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
    };
  }, [participant]);

  // 3. Fallback to client-side volume analysis when speaking events are not available (e.g. local participant before join).
  const trackVolume = useTrackVolume(micTrackRef);
  const volume = participant?.isLocal ? trackVolume : participant?.audioLevel ?? trackVolume;

  // 4. Combine event-based flag with volume threshold for local tracks
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastAboveRef = useRef<number>(0);

  // Любой ненулевой уровень считаем речью (fallback, пока нет eventSpeaking)
  const aboveThreshold = useMemo(() => {
    if (volume == null) return false;
    return volume !== 0;
  }, [volume]);

  useEffect(() => {
    const now = performance.now();
    const speaking = eventSpeaking || aboveThreshold;
    if (speaking) {
      lastAboveRef.current = now;
      if (!isSpeaking) setIsSpeaking(true);
    } else if (isSpeaking && now - lastAboveRef.current > holdMs) {
      setIsSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSpeaking, aboveThreshold, holdMs]);
  // Debug logging (comment out in prod)
  // console.log('[useInstantIsSpeaking]', { volume, eventSpeaking, aboveThreshold, isSpeaking });

  return isSpeaking;
} 