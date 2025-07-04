import { Box } from '@mui/material';
import { useMembersQuery } from '../../api/members.query';
import { ServerMemberItem } from '../molecules/ServerMemberItem';
import { useParticipants, useTracks } from '@livekit/components-react';
import { useMemo } from 'react';
import { Track } from 'livekit-client';
import { useStream } from '@entities/streams/model/useStream';

interface ServerMembersProps {
  serverId: string;
}

export const ServerMembers: React.FC<ServerMembersProps> = ({ serverId }) => {
  const { data: members, isLoading } = useMembersQuery(serverId);
  const tracks = useTracks([Track.Source.Microphone]);
  const { streamTracks } = useStream();

  const participants = useParticipants();
  const membersMap = useMemo(() => {
    return new Map(members?.map((member) => [member.id, member]));
  }, [members]);

  const streamTracksMap = useMemo(() => {
    return new Map(streamTracks.map((t) => [t.participant.identity, t]));
  }, [streamTracks]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flex: 1,
      }}
    >
      {participants?.map((participant) => {
        return (
          <ServerMemberItem
            key={participant.sid}
            member={membersMap.get(participant.identity)}
            streamTrack={streamTracksMap.get(participant.identity)}
            participant={participant}
          />
        );
      })}
    </Box>
  );
};
