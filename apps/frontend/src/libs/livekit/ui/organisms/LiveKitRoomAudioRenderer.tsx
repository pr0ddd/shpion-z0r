import {
  AudioTrack,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

import { useParticipantMetadata } from '@entities/members/model/useLocalParticipantMetadata';

interface LiveKitRoomAudioRendererProps {}

export const LiveKitRoomAudioRenderer: React.FC<
  LiveKitRoomAudioRendererProps
> = () => {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Microphone]);
  const { getMetadata } = useParticipantMetadata(localParticipant);
  const isVolumeOn = getMetadata('volumeOn') ?? true;

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
