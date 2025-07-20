import {
  AudioTrack,
  useLocalParticipant,
  useTracks,
  useRoomContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect } from 'react';
import { getGlobalAudioContext } from '@libs/audioContext';

import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';

interface LiveKitRoomAudioRendererProps {}

export const LiveKitRoomAudioRenderer: React.FC<
  LiveKitRoomAudioRendererProps
> = () => {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Microphone]);
  const { getMetadata } = useParticipantMetadata(localParticipant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;

  /* --- Ensure audio context & room playback are resumed after a user gesture --- */
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;

    const resume = async () => {
      try {
        await room.startAudio();
      } catch {}

      const ctx = getGlobalAudioContext();
      if (ctx && ctx.state !== 'running') {
        try {
          await ctx.resume();
        } catch {}
      }
    };

    const onGesture = () => {
      resume();
      window.removeEventListener('click', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };

    window.addEventListener('click', onGesture);
    window.addEventListener('touchstart', onGesture);

    return () => {
      window.removeEventListener('click', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
  }, [room]);

  return (
    <>
      {tracks.map((track) =>
        !track.participant.isLocal ? (
          <AudioTrack
            key={track.participant.sid}
            trackRef={track}
            volume={isVolumeOn ? 1 : 0}
          />
        ) : null
      )}
    </>
  );
};
