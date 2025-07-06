import { TrackReference, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useMemo } from 'react';

const concatIds = (tracks: TrackReference[]) =>
  tracks.map((t) => t.publication?.track?.sid).join('__');

export const useStream = () => {
  const tracks = useTracks([
    Track.Source.ScreenShare,
    Track.Source.ScreenShareAudio,
  ]);

  const streamTracksWithAudio = useMemo(() => {
    return tracks;
  }, [concatIds(tracks)]);

  const streamTracks = useMemo(() => {
    return tracks.filter((t) => t.source === Track.Source.ScreenShare);
  }, [concatIds(tracks)]);

  return {
    streamTracksWithAudio,
    streamTracks,
  };
};
