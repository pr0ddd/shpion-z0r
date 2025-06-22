import React, { useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
} from '@mui/material';
import { useParticipants } from '@livekit/components-react';
import { useServer } from '@shared/hooks';
import { useServerStore } from '@shared/hooks';
import { VoiceControlBar, MemberRow } from '@shared/ui';
import { Participant } from 'livekit-client';
import { User, Member } from '@shared/types';

const MemberSkeleton = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText primary={<Skeleton variant="text" width="80%" />} />
  </ListItem>
);

export const ServerMembers: React.FC = () => {
  const { selectedServer, members: allServerMembers, areMembersLoading } = useServer() as any;
  const listeningStates = useServerStore(s=>s.listeningStates);
  const participants = useParticipants();

  const onlineMembers = useMemo(() => {
    const memberMap = new Map(allServerMembers.map((m: Member) => [m.user.id, m.user]));
    return participants
      .map((p) => ({
        participant: p,
        user: memberMap.get(p.identity),
      }))
      .filter((item) => item.user !== undefined) as { participant: Participant; user: User }[];
  }, [allServerMembers, participants]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: 340,
        flex: '0 0 340px',
        zIndex: 1,
        boxSizing: 'border-box',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '1rem',
        color: 'white',
        background: '#2f3136',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 0,
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        <List>
          {areMembersLoading && onlineMembers.length === 0 ? (
            <>
              <MemberSkeleton />
              <MemberSkeleton />
            </>
          ) : (
            onlineMembers.map(({ participant, user }) => (
              <MemberRow key={participant.sid} participant={participant} user={user} isDeafened={listeningStates?.[user.id] === false} />
            ))
          )}
        </List>
      </Box>
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <VoiceControlBar onDisconnect={() => {}} />
      </Box>
    </Box>
  );
}; 