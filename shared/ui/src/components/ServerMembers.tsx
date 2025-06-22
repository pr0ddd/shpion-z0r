import React, { useMemo } from 'react';
import {
  Box,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
} from '@mui/material';
import { useParticipants } from '@livekit/components-react';
import { useAppStore, useMembersQuery, useServerStore } from '@shared/hooks';
import { VoiceControlBar } from '@shared/ui';
import { Participant } from 'livekit-client';
import { User, Member } from '@shared/types';
import { MemberRow } from '@shared/ui';
import { Virtuoso } from 'react-virtuoso';

const MemberSkeleton = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText primary={<Skeleton variant="text" width="80%" />} />
  </ListItem>
);

export const ServerMembers = () => {
  const serverId = useAppStore(s=>s.selectedServerId);
  const { data: allServerMembers = [], isLoading: isMembersLoading } = useMembersQuery(serverId);
  const selectedServer = null; // invite dialog disabled until refactor
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
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 72,
        width: 340,
        boxSizing: 'border-box',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        color: 'white',
        background: '#2f3136',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {isMembersLoading && onlineMembers.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <MemberSkeleton />
            <MemberSkeleton />
          </Box>
        ) : (
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={onlineMembers.length}
            itemContent={(index) => {
              const { participant, user } = onlineMembers[index];
              return (
                <Box sx={{ px: 1 }}>
                  <MemberRow
                    participant={participant}
                    user={user}
                    isDeafened={listeningStates?.[user.id] === false}
                  />
                </Box>
              );
            }}
            overscan={200}
          />
        )}
      </Box>
      <Box sx={{ mt: 'auto', pt: 2, p: 1 }}>
        <VoiceControlBar onDisconnect={() => {}} />
      </Box>
    </Box>
  );
}; 