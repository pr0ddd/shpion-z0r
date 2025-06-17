import React from 'react';
import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Slider,
  Typography,
  Stack,
} from '@mui/material';
import Mic from '@mui/icons-material/Mic';
import MicOff from '@mui/icons-material/MicOff';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';

export interface MemberListItemData {
  id: string;
  username: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  audioNode?: React.ReactNode;
}

interface MemberListViewProps {
  members: MemberListItemData[];
  loading?: boolean;
}

const MemberSkeleton: React.FC = () => (
  <ListItem>
    <ListItemAvatar>
      <Skeleton variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText primary={<Skeleton variant="text" width="80%" />} />
  </ListItem>
);

const MemberRow: React.FC<{ member: MemberListItemData }> = ({ member }) => (
  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
    {member.audioNode}
    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
      <ListItemAvatar>
        <Avatar
          src={member.avatar || undefined}
          sx={{
            border: member.isSpeaking ? '2px solid #4ade80' : '2px solid transparent',
            boxShadow: member.isSpeaking ? '0 0 8px #4ade80' : 'none',
            transition: 'all 0.2s ease-in-out',
          }}
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body1"
              component="span"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {member.username}
            </Typography>
            {member.isMuted ? (
              <MicOff sx={{ fontSize: 16, color: 'text.secondary' }} />
            ) : (
              <Mic sx={{ fontSize: 16, color: 'text.secondary' }} />
            )}
          </Box>
        }
      />
    </Box>
    <Stack spacing={2} direction="row" sx={{ width: '100%', px: 2, pt: 1 }} alignItems="center">
      <VolumeDown />
      <Slider
        aria-label="Volume"
        value={member.volume}
        onChange={(e, newValue) => member.onVolumeChange(newValue as number)}
        min={0}
        max={1}
        step={0.01}
      />
      <VolumeUp />
    </Stack>
  </ListItem>
);

export const MemberListView: React.FC<MemberListViewProps> = ({ members, loading }) => (
  <List>
    {loading && members.length === 0 ? (
      <>
        <MemberSkeleton />
        <MemberSkeleton />
      </>
    ) : (
      members.map((m) => <MemberRow key={m.id} member={m} />)
    )}
  </List>
);

export default MemberListView; 