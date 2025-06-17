import React, { useMemo, useState } from 'react';
import { Avatar, Box, IconButton, Menu, MenuItem, Slider, Tooltip, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import HeadsetIcon from '@mui/icons-material/Headset';
import SignalCellular0BarIcon from '@mui/icons-material/SignalCellular0Bar';
import SignalCellular2BarIcon from '@mui/icons-material/SignalCellular2Bar';
import SignalCellular3BarIcon from '@mui/icons-material/SignalCellular3Bar';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import { AudioTrack, useIsSpeaking, useIsMuted, useTracks, useRoomContext } from '@livekit/components-react';
import { Participant, Track, ConnectionQuality } from 'livekit-client';
import { User } from '@shared/types';
import { dicebearAvatar } from '../lib/ui';

interface MemberRowProps {
  participant: Participant;
  user: User;
  isDeafened: boolean;
}

export const MemberRow: React.FC<MemberRowProps> = ({ participant, user, isDeafened }) => {
  const room = useRoomContext();
  const isSpeaking = useIsSpeaking(participant);
  const isSelf = participant.isLocal;
  const isMuted = isSelf
    ? !(room?.localParticipant.isMicrophoneEnabled ?? true)
    : useIsMuted({ source: Track.Source.Microphone, participant });

  const tracks = useTracks([Track.Source.Microphone]);
  const audioTrack = useMemo(
    () => tracks.find((t) => t.participant.identity === participant.identity),
    [tracks, participant.identity]
  );

  const [volume, setVolume] = useState(1);

  // connection quality / ping indicator
  const quality = participant.connectionQuality ?? ConnectionQuality.Unknown;
  let QualityIcon: React.ElementType = SignalCellular0BarIcon;
  if (quality === ConnectionQuality.Excellent) QualityIcon = SignalCellular4BarIcon;
  else if (quality === ConnectionQuality.Good) QualityIcon = SignalCellular3BarIcon;
  else if (quality === ConnectionQuality.Poor) QualityIcon = SignalCellular2BarIcon;

  // context-menu (right-click) handling
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (isSelf) return; // не показываем меню для себя
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);

  return (
    <Box onContextMenu={openMenu}
      className="allow-context"
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        cursor: 'context-menu',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.04)',
        },
        transition: 'background-color .15s',
      }}
    >
      {audioTrack && <AudioTrack trackRef={audioTrack} volume={volume} />}
      <Avatar
        src={user.avatar || dicebearAvatar(user.id)}
        sx={{
          width: 32,
          height: 32,
          border: isSpeaking ? '2px solid #4ade80' : '2px solid transparent',
          boxShadow: isSpeaking ? '0 0 6px #4ade80' : 'none',
          transition: 'all 0.2s ease-in-out',
        }}
      />
      <Box sx={{ ml: 1, flexGrow: 1, overflow: 'hidden' }}>
        <Typography
          variant="body2"
          noWrap
          sx={{ color: 'text.primary', fontWeight: 500 }}
        >
          {user.username}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', mr: 1 }}>
        {isMuted ? (
          <MicOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        ) : (
          <MicIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        )}
        {isDeafened ? (
          <HeadsetOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        ) : (
          <HeadsetIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        )}
        <Tooltip title={`Состояние соединения: ${quality}`}>
          <QualityIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Tooltip>
      </Box>

      {/* контекстное меню с ползунком громкости */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <Box sx={{ width: 180, px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Громкость
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VolumeDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Slider
              value={volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, v) => setVolume(v as number)}
              sx={{ mx: 1 }}
            />
            <VolumeUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Box>
        </Box>
        <MenuItem onClick={() => { navigator.clipboard.writeText(user.id); closeMenu(); }}>Копировать ID</MenuItem>
      </Menu>
    </Box>
  );
};

export default MemberRow; 