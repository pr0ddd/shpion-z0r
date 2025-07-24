import { Box } from '@mui/material';
import { useMembersQuery } from '../../api/members.query';
import { ServerMemberItem } from '../molecules/ServerMemberItem';
import { useParticipants, useTracks } from '@livekit/components-react';
import { useMemo } from 'react';
import { useStream } from '@entities/streams/model/useStream';
import { Track } from 'livekit-client';

interface ServerMembersProps {
  serverId: string;
}

export const ServerMembers: React.FC<ServerMembersProps> = ({ serverId }) => {
  const { data: members, isLoading } = useMembersQuery(serverId);
  const { streamTracks } = useStream();
  const cameraTracks = useTracks([Track.Source.Camera]);

  const participants = useParticipants();
  // Сопоставляем по user.id (identity LiveKit == user.id). Иначе member не находится.
  const membersMap = useMemo(() => {
    return new Map(members?.map((member) => [member.user.id, member]));
  }, [members]);

  const cameraCountMap = useMemo(() => {
    const map = new Map<string, number>();
    cameraTracks.forEach((t) => {
      const id = t.participant.identity;
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [cameraTracks]);

  const screenShareCountMap = useMemo(() => {
    const map = new Map<string, number>();
    streamTracks.forEach((t) => {
      if (t.source !== Track.Source.ScreenShare) return;
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
            cameraCount={cameraCountMap.get(participant.identity) ?? 0}
            totalStreamCount={
              (cameraCountMap.get(participant.identity) ?? 0) +
              (screenShareCountMap.get(participant.identity) ?? 0)
            }
            isStreaming={
              (cameraCountMap.get(participant.identity) ?? 0) > 0 ||
              (screenShareCountMap.get(participant.identity) ?? 0) > 0
            }
            participant={participant}
          />
        );
      })}
    </Box>
  );
};
