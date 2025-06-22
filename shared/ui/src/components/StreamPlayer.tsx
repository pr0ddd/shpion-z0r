import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TrackReference, useTracks, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';

export interface StreamPlayerProps {
  trackRef: TrackReference | null;
  // legacy props – ignored in simplified player
  mode?: any;
  onClose?: () => void;
  onPopout?: () => void;
}

/**
 * Extremely simple stream player: plain <video> element with native controls.
 * No custom overlays, no audio magic – relies on browser defaults.
 */
export const StreamPlayer: React.FC<StreamPlayerProps> = ({ trackRef, mode }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // We only care about screen-share audio here, no microphone tracks
  const audioTracks = useTracks([Track.Source.ScreenShareAudio]);
  const audioRef = audioTracks.find(
    (t) =>
      trackRef &&
      t.participant?.sid === trackRef.participant?.sid &&
      t.publication?.source === Track.Source.ScreenShareAudio,
  );

  // Attach / detach LiveKit track manually
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!trackRef || !videoEl) return;

    try {
      trackRef.publication?.track?.attach(videoEl as HTMLMediaElement);
      videoEl.controls = true;
      videoEl.muted = mode === 'tab';
      videoEl.style.objectFit = 'contain';
      videoEl.play().catch(() => {});
    } catch (e) {
      console.error('Attach track failed', e);
    }

    return () => {
      try {
        trackRef.publication?.track?.detach(videoEl as HTMLMediaElement);
      } catch {}
    };
  }, [trackRef, mode]);

  return (
    <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {trackRef ? (
        <video ref={videoRef} style={{ width: '100%', height: '100%' }} playsInline />
      ) : (
        <CircularProgress />
      )}
      {audioRef && <AudioTrack trackRef={audioRef} volume={1} />}
    </Box>
  );
}; 