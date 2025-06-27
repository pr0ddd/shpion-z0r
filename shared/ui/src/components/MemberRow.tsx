import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Menu, MenuItem, Slider, Typography, Chip, IconButton, Divider, Button } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { AudioTrack, useIsSpeaking, useIsMuted, useTracks, useRoomContext } from '@livekit/components-react';
import { Participant, Track } from 'livekit-client';
import { User } from '@shared/types';
import { dicebearAvatar } from '../lib/ui';
import { useAuth } from '@features/auth';
import { useNotification } from '@features/notifications';
import { useServerStore } from '@features/servers';
import { useAppStore } from '../../../../apps/frontend/src/stores/useAppStore';
import ScreenSharePreview from './ScreenSharePreview';
import { useStreamViewStore } from '@shared/hooks';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import { usePopupState, bindHover, bindPopover } from 'material-ui-popup-state/hooks';
import { isRemotePublication } from '@shared/hooks/lib/livekitUtils';

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

  const remoteDeaf = isDeafened ?? false;
  const headphoneOff = participant.isLocal ? !listeningSelf : remoteDeaf;

  // итоговая громкость учитывает глобальное состояние заглушения
  const effectiveVolume = listeningSelf ? sliderVolume : 0;

  // detect if participant is currently publishing at least one screen-share track
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const isLive = useMemo(
    () => screenShareTracks.some((t) => t.participant?.sid === participant.sid),
    [screenShareTracks, participant.sid],
  );
  const participantScreenShares = useMemo(
    () => screenShareTracks.filter((t) => t.participant?.sid === participant.sid),
    [screenShareTracks, participant.sid],
  );

  // open state only when popup is open AND there is at least one screen share
  const isPreviewOpen = popupState.isOpen && participantScreenShares.length > 0;

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
        <ScreenSharePreview key={`preload-${track.publication.trackSid}`} trackRef={track} staticImage />
      ))}
    </Box>
  );

  const selectedSids = useStreamViewStore((s) => s.selectedSids);

  const participantSelected = useMemo(()=> participantScreenShares.some(tr=> selectedSids.includes(tr.publication.trackSid)), [participantScreenShares, selectedSids]);

  // snackbar on stream start
  const { showNotification } = useNotification();
  const prevStreamCountRef = useRef<number>(participantScreenShares.length);

  useEffect(() => {
    const prev = prevStreamCountRef.current;
    const curr = participantScreenShares.length;
    if (curr > prev && !isSelf) {
      showNotification(`${user.username} начинает видеотрансляцию`, 'info');
    }
    prevStreamCountRef.current = curr;
  }, [participantScreenShares.length, isSelf, showNotification, user.username]);

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
        bgcolor: isPreviewOpen ? '#2B2D31' : 'transparent',
        '&:hover': {
          bgcolor: '#2B2D31',
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
            <Chip label={`В эфире${participantScreenShares.length > 1 ? ` (${participantScreenShares.length})` : ''}`} size="small" color="error" />
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
          slotProps={{ paper: { sx: { bgcolor: '#2B2D31', p: 1, borderRadius: 1, border: '1px solid rgba(255,255,255,0.15)', boxShadow:'none', width: 'auto', ml: 1 } } }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {participantScreenShares.map((track, idx) => (
              <React.Fragment key={track.publication.trackSid}>
                <Box sx={{ position:'relative', width: 230, height: 130, borderRadius:1, overflow:'hidden' }}>
                  <ScreenSharePreview trackRef={track} width={230} height={130} staticImage />
                  <Box sx={{ position:'absolute', inset:0, bgcolor:'rgba(0,0,0,0.35)', display:'flex', flexDirection:'column', justifyContent:'space-between', alignItems:'center', p:0.5 }}>
                    <Chip label={(track.publication.trackName ?? `Стрим №${idx+1}`).slice(0,30)} size="small" sx={{ bgcolor:'rgba(44, 44, 44, 0.67)', color:'#fff', fontWeight:600, pointerEvents:'none' }} />
                    <Box sx={{ display:'flex', gap:0.5 }}>
                      <IconButton onClick={(e)=>{e.stopPropagation(); openStream(track.publication.trackSid);}} sx={{ bgcolor:'primary.main', color:'#fff', width: 32, height: 24, borderRadius: 1, p:0, '&:hover':{ bgcolor:'primary.dark' } }}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                      {selectedSids.includes(track.publication.trackSid) ? (
                        <IconButton onClick={(e)=>{e.stopPropagation(); const store = useStreamViewStore.getState(); if(isRemotePublication(track.publication)){ void track.publication.setSubscribed(false); } store.removeFromMultiView(track.publication.trackSid);}} sx={{ bgcolor:'error.main', color:'#fff', width: 32, height: 24, borderRadius: 1, p:0, '&:hover':{ bgcolor:'error.dark' } }}>
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton onClick={(e)=>{e.stopPropagation(); const store = useStreamViewStore.getState(); if(isRemotePublication(track.publication)){ void track.publication.setSubscribed(true); } store.addToMultiView(track.publication.trackSid);}} sx={{ bgcolor:'success.main', color:'#fff', width: 32, height: 24, borderRadius: 1, p:0, '&:hover':{ bgcolor:'success.dark' } }}>
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
                {idx !== participantScreenShares.length-1 && <Divider sx={{ bgcolor:'rgba(255,255,255,0.06)' }}/>} 
              </React.Fragment>
            ))}
            <Divider sx={{ bgcolor:'rgba(255,255,255,0.06)' }} />
            {/* Кнопка управления всеми стримами участника */}
            <Button variant="contained" color={participantSelected? 'error':'success'} size="small" fullWidth onClick={(e)=>{
              e.stopPropagation();
              const store = useStreamViewStore.getState();
              if (participantSelected) {
                // Убираем все треки данного участника из просмотра и отписываемся
                participantScreenShares.forEach(tr => {
                  if(isRemotePublication(tr.publication)) void tr.publication.setSubscribed(false);
                  store.removeFromMultiView(tr.publication.trackSid);
                });
              } else {
                const firstSid = participantScreenShares[0]?.publication.trackSid;
                store.setMultiView(true, firstSid);
                participantScreenShares.forEach(tr => {
                  if(isRemotePublication(tr.publication)) void tr.publication.setSubscribed(true);
                  store.addToMultiView(tr.publication.trackSid);
                });
              }
            }}>
              {participantSelected ? 'Убрать все' : 'Смотреть все'}
            </Button>
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