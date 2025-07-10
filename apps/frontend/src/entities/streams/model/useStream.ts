import { TrackReference, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useMemo } from 'react';

const concatIds = (tracks: TrackReference[]) =>
  tracks.map((t) => t.publication?.track?.sid).join('__');

export const useStream = () => {
  const tracks = useTracks([
    Track.Source.ScreenShare,
    Track.Source.ScreenShareAudio,
    Track.Source.Camera,
  ]);

  const streamTracksWithAudio = useMemo(() => {
    return tracks;
  }, [concatIds(tracks)]);

  const streamTracks = useMemo(() => {
    return tracks.filter(
      (t) => t.source === Track.Source.ScreenShare || t.source === Track.Source.Camera
    );
  }, [concatIds(tracks)]);

  return {
    streamTracksWithAudio,
    streamTracks,
  };
};
