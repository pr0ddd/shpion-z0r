import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
} from '@mui/material';
import { useParticipants } from '@livekit/components-react';
import { useServer } from '@shared/hooks';
import { VoiceControlBar } from '@shared/ui';
import { Participant } from 'livekit-client';
import { User, Member } from '@shared/types';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { MemberRow } from '@shared/ui';

const MemberSkeleton = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText primary={<Skeleton variant="text" width="80%" />} />
  </ListItem>
);

const InviteDialog = ({
  open,
  onClose,
  inviteCode,
}: {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
}) => {
  const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: '#2f3136', color: 'white' } }}>
      <DialogTitle>Пригласить друзей</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Поделитесь этой ссылкой, чтобы пригласить кого-нибудь на этот сервер.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField fullWidth value={inviteLink} InputProps={{ readOnly: true }} variant="filled" />
          <Button onClick={handleCopy} variant="contained" startIcon={<ContentCopyIcon />}>
            {copied ? 'Скопировано!' : 'Копировать'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export const ServerMembers = () => {
  const { selectedServer, members: allServerMembers, areMembersLoading, listeningStates = {} } = useServer() as any;
  const participants = useParticipants();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

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
        width: 240,
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '1rem',
        color: 'white',
        background: '#2f3136',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1, flexShrink: 0 }}>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setInviteDialogOpen(true)}>
          Пригласить
        </Button>
      </Box>
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
      {selectedServer && (
        <InviteDialog
          open={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          inviteCode={selectedServer.inviteCode}
        />
      )}
    </Box>
  );
}; 