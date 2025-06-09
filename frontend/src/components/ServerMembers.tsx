import React, { memo, useState, useMemo } from 'react';
import {
  Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  Button, Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Participant, Track } from 'livekit-client';
import { 
  useParticipants, 
  useSpeakingParticipants, 
  TrackToggle,
  DisconnectButton
} from '@livekit/components-react';
import { useServer } from '../contexts/ServerContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InviteManager from './InviteManager';

const MembersWrapper = styled(Box)(({ theme }) => ({
  width: 320,
  height: '100%',
  backgroundColor: theme.palette.discord.members_bg,
  borderRight: `1px solid ${theme.palette.discord.sidebar}`,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
}));

const UserList = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(0, 1),
}));

const UserListItem = styled(ListItem)<{ isspeaking?: string }>(({ theme, isspeaking }) => ({
  padding: theme.spacing(1, 1.5),
  borderRadius: '4px',
  margin: theme.spacing(0.5, 0),
  backgroundColor: isspeaking === 'true' ? 'rgba(71, 169, 93, 0.2)' : 'transparent',
  border: isspeaking === 'true' ? `1px solid ${theme.palette.discord.green}` : '1px solid transparent',
  transition: 'all 0.2s',
  '& .MuiListItemText-primary': {
    color: 'white',
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  '& .MuiListItemText-root': {
    minWidth: 0,
  }
}));

const VoiceChannelMembers: React.FC = () => {
    const participants = useParticipants();
    const speakingParticipants = useSpeakingParticipants();

    const MemberItem = useMemo(() => memo(({ participant }: { participant: Participant }) => {
        const isSpeaking = speakingParticipants.includes(participant);
        const username = participant.identity;

        return (
            <UserListItem isspeaking={isSpeaking.toString()}>
                <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32 }}>{username.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={username} />
            </UserListItem>
        );
    }), [speakingParticipants]);

    return (
        <>
            <Typography variant="overline" sx={{ p: 2, color: 'text.secondary' }}>
                В голосе — {participants.length}
            </Typography>
            {participants.map(p => <MemberItem key={p.sid} participant={p} />)}
        </>
    );
};

interface ServerMembersProps {
  isConnected: boolean;
}

const ControlButtonWrapper = styled('div')({
  '& .lk-button': {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
    },
  },
});

const RedDisconnectButton = styled(DisconnectButton)({
  background: '#f04747',
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 0,
  color: 'white',
  '&:hover': {
    background: '#d84040',
  }
});

const CustomControlBar: React.FC = () => {
  return (
    <Box sx={{ p: 1.5, backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
        <ControlButtonWrapper>
          <TrackToggle source={Track.Source.Microphone} />
        </ControlButtonWrapper>
        <ControlButtonWrapper>
          <TrackToggle source={Track.Source.Camera} />
        </ControlButtonWrapper>
        <ControlButtonWrapper>
          <TrackToggle source={Track.Source.ScreenShare} />
        </ControlButtonWrapper>
        <RedDisconnectButton />
      </Stack>
    </Box>
  );
};

const ServerMembers: React.FC<ServerMembersProps> = ({ isConnected }) => {
  const { selectedServer } = useServer();
  const [inviteManagerOpen, setInviteManagerOpen] = useState(false);

  if (!selectedServer) {
    return (
      <MembersWrapper sx={{ alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Выберите сервер для просмотра участников.
        </Typography>
      </MembersWrapper>
    );
  }

  return (
    <MembersWrapper>
      <Box sx={{ p: 2, borderBottom: `1px solid #202225` }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteManagerOpen(true)}
        >
          Пригласить
        </Button>
      </Box>
      <UserList>
        {isConnected && <VoiceChannelMembers />}
      </UserList>

      {isConnected && <CustomControlBar />}

      <InviteManager
        open={inviteManagerOpen}
        onClose={() => setInviteManagerOpen(false)}
        serverId={selectedServer?.id}
        serverName={selectedServer?.name}
      />
    </MembersWrapper>
  );
};

export default memo(ServerMembers); 