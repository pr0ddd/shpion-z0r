import React, { useMemo, useState } from 'react';
import { Avatar, Box, Menu, MenuItem, Slider, Typography, Chip, IconButton, Divider } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AudioTrack, useIsSpeaking, useIsMuted, useTracks, useRoomContext } from '@livekit/components-react';
import { Participant, Track } from 'livekit-client';
import { User } from '@shared/types';
import { dicebearAvatar } from '../lib/ui';
import { useAuth } from '@shared/hooks';
import { useServerStore } from '@shared/hooks';
import { useAppStore } from '@shared/hooks';
import ScreenSharePreview from './ScreenSharePreview';
import { useStreamViewStore } from '@shared/hooks';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import { usePopupState, bindHover, bindPopover } from 'material-ui-popup-state/hooks';

interface MemberRowProps {
  participant: Participant;
  user: User;
  isDeafened?: boolean;
}

const MemberRowInner: React.FC<MemberRowProps> = ({ participant, user, isDeafened }) => {
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

  const [sliderVolume, setSliderVolume] = useState(1);
  const popupState = usePopupState({ variant: 'popover', popupId: `preview-${participant.sid}` });

  const { user: me } = useAuth();
  const listeningSelf = useServerStore((s) => (me?.id ? s.listeningStates[me.id] : true) ?? true);

  const selectedServerId = useAppStore((s)=> s.selectedServerId);
  const openStream = (sid:string)=>{
    if (!selectedServerId) return;
    const url = `${window.location.origin}/stream/${selectedServerId}/${sid}?auto=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const setActiveStream = useStreamViewStore((state:any)=>state.setActiveStream);

  const remoteDeaf = isDeafened ?? false;
  const headphoneOff = participant.isLocal ? !listeningSelf : remoteDeaf;

  // итоговая громкость учитывает глобальное состояние заглушения
  const effectiveVolume = listeningSelf ? sliderVolume : 0;

  // detect if participant is currently publishing at least one screen-share track
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const isLive = useMemo(
    () => screenShareTracks.some((t) => t.participant?.sid === participant.sid),
    [screenShareTracks, participant.sid],
  );
  const participantScreenShares = useMemo(
    () => screenShareTracks.filter((t) => t.participant?.sid === participant.sid),
    [screenShareTracks, participant.sid],
  );

  // context-menu (right-click) handling
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault(); // блокируем стандартное меню всегда
    if (isSelf) return; // не открываем наше меню для себя
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);

  // ensure previews are mounted even before hover (for faster show)
  const preload = (
    <Box sx={{ display: 'none' }}>
      {participantScreenShares.map((track) => (
        <ScreenSharePreview key={`preload-${track.publication.trackSid}`} trackRef={track} />
      ))}
    </Box>
  );

  return (
    <Box
      {...bindHover(popupState)}
      onContextMenu={openMenu}
      className="allow-context"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: 1,
        py: 0.5,
        mb: 0.9,
        borderRadius: 1,
        cursor: 'context-menu',
        border: '1px solid rgba(255,255,255,0.05)',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.15)',
        },
        transition: 'background-color .15s, border-color .15s',
      }}
    >
      {audioTrack && <AudioTrack trackRef={audioTrack} volume={effectiveVolume} />}

      {/* top row */}
      <Box sx={{ display: 'flex', alignItems: 'center', height: 32, overflow: 'hidden' }}>
        <Avatar
          src={user.avatar || dicebearAvatar(user.id)}
          sx={{
            width: 32,
            height: 32,
            border: isSpeaking ? '2px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.7)',
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
          {isLive && (
            <Chip label="В эфире" size="small" color="error" />
          )}
          {isMuted && (
            <MicOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          )}
          {headphoneOff && (
            <HeadsetOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          )}
        </Box>
      </Box>

      {/* контекстное меню с ползунком громкости */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        MenuListProps={{ disablePadding: true }}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 1,
            minWidth: 220,
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
            Громкость
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VolumeDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Slider
              value={sliderVolume}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, v) => setSliderVolume(v as number)}
              color="primary"
              size="small"
              sx={{ mx: 1, flex: 1 }}
            />
            <VolumeUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Box>
        </Box>
        <MenuItem onClick={() => { navigator.clipboard.writeText(user.id); closeMenu(); }}>
          Копировать ID
        </MenuItem>
      </Menu>

      {/* render hidden previews for preloading */}
      {participantScreenShares.length > 0 && preload}

      {participantScreenShares.length > 0 && (
        <HoverPopover
          {...bindPopover(popupState)}
          disableRestoreFocus
          keepMounted
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { bgcolor: '#1b1c22', p: 1, borderRadius: 2, border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 10px 24px rgba(0,0,0,0.8)', minWidth: 380, ml: '5px' } } }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {participantScreenShares.map((track, idx) => (
              <React.Fragment key={track.publication.trackSid}>
                <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, py:0.5, px:0.5, borderRadius:1, transition:'background-color .15s', '&:hover':{ bgcolor:'rgba(255,255,255,0.06)' } }}>
                  <ScreenSharePreview trackRef={track} width={120} height={68} />
                  <Typography variant="body2" sx={{ flexGrow:1, color: 'white', fontWeight: 500 }}>
                    Стрим №{idx + 1}
                  </Typography>
                  <Chip label="Смотреть" size="small" color="primary" sx={{ fontWeight:600, px:1.5 }} onClick={(e)=>{e.stopPropagation(); setActiveStream(track.publication.trackSid);}} />
                  <IconButton size="small" onClick={(e)=>{e.stopPropagation(); openStream(track.publication.trackSid);}} sx={{ ml:0.5, color:'grey.300' }}>
                    <OpenInNewIcon fontSize="inherit" />
                  </IconButton>
                </Box>
                {idx !== participantScreenShares.length-1 && <Divider sx={{ bgcolor:'rgba(255,255,255,0.06)' }}/>} 
              </React.Fragment>
            ))}
          </Box>
        </HoverPopover>
      )}
    </Box>
  );
};

// prevent unnecessary re-renders by comparing shallow props & participant state that matter
export const MemberRow = React.memo(MemberRowInner, (prev, next) => {
  return (
    prev.participant.sid === next.participant.sid &&
    prev.participant.connectionQuality === next.participant.connectionQuality &&
    prev.user.id === next.user.id &&
    prev.user.username === next.user.username &&
    prev.user.avatar === next.user.avatar &&
    prev.isDeafened === next.isDeafened
  );
});

export default MemberRow; 