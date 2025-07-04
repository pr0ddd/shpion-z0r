import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';
import {
  AudioTrack,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect } from 'react';

interface LiveKitRoomAudioRendererProps {}

export const LiveKitRoomAudioRenderer: React.FC<
  LiveKitRoomAudioRendererProps
> = () => {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Microphone]);
  const { getMetadata } = useParticipantMetadata(localParticipant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;
  
  useEffect(() => {
    console.log('Tracks', tracks)
  }, [tracks])

  return (
    <>
      {tracks.map((track) =>
        !track.participant.isLocal ? (
          <AudioTrack
          key={track.participant.sid}
          trackRef={track}
          volume={isVolumeOn ? 1 : 0} />
        ) : null
      )}
    </>
  );
};
