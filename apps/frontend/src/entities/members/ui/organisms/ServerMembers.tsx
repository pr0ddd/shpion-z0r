import { Box } from '@mui/material';
import { useMembersQuery } from '../../api/members.query';
import { ServerMemberItem } from '../molecules/ServerMemberItem';
import { useParticipants } from '@livekit/components-react';
import { useMemo } from 'react';
import { useStream } from '@entities/streams/model/useStream';

interface ServerMembersProps {
  serverId: string;
}

export const ServerMembers: React.FC<ServerMembersProps> = ({ serverId }) => {
  const { data: members, isLoading } = useMembersQuery(serverId);
  const { streamTracks } = useStream();

  const participants = useParticipants();
  // Сопоставляем по user.id (identity LiveKit == user.id). Иначе member не находится.
  const membersMap = useMemo(() => {
    return new Map(members?.map((member) => [member.user.id, member]));
  }, [members]);

  const streamCountMap = useMemo(() => {
    const map = new Map<string, number>();
    streamTracks.forEach((t) => {
      const id = t.participant.identity;
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [streamTracks]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flex: 1,
        p: 1, // remove all padding to eliminate gaps
      }}
    >
      {participants?.map((participant) => {
        return (
          <ServerMemberItem
            key={participant.sid}
            member={membersMap.get(participant.identity)}
            totalStreamCount={streamCountMap.get(participant.identity) ?? 0}
            isStreaming={(streamCountMap.get(participant.identity) ?? 0) > 0}
            participant={participant}
          />
        );
      })}
    </Box>
  );
};
