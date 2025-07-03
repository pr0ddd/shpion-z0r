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
import { useServer, useServerStore } from '@features/servers';
import { Participant } from 'livekit-client';
import { User, Member } from '@shared/types';

import { MemberRow } from './MemberRow';
import { VoiceControlBar } from './VoiceControlBar';
import { DeepFilterSettings } from '@components/DeepFilterToggle';
import { DeepFilterState } from '@features/audio';

const MemberSkeleton = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText primary={<Skeleton variant="text" width="80%" />} />
  </ListItem>
);

interface ServerMembersProps {
  // 🎤 DeepFilter пропсы
  deepFilterSettings?: DeepFilterSettings;
  onDeepFilterChange?: (settings: DeepFilterSettings) => void;
  deepFilterState?: DeepFilterState;
}

export const ServerMembers: React.FC<ServerMembersProps> = ({
  deepFilterSettings,
  onDeepFilterChange,
  deepFilterState
}) => {
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
        <VoiceControlBar 
          onDisconnect={() => {}}
          deepFilterSettings={deepFilterSettings}
          onDeepFilterChange={onDeepFilterChange}
          deepFilterState={deepFilterState}
        />
      </Box>
    </Box>
  );
}; 