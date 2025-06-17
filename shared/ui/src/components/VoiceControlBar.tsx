import React from 'react';
import { Box, IconButton, Tooltip, Typography, Menu, MenuItem } from '@mui/material';
import { useRoomContext, useMediaDeviceSelect } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { useScreenShare } from '@shared/livekit';
import { useServer, useServerStore, useNotification, useSocket, useAuth } from '@shared/hooks';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface VoiceControlBarProps {
  onDisconnect: () => void;
}

const ToggleButton: React.FC<{
  enabled: boolean;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  titleOn: string;
  titleOff: string;
  onClick: () => void;
}> = ({ enabled, iconOn, iconOff, titleOn, titleOff, onClick }) => (
  <Tooltip
    title={enabled ? titleOff : titleOn}
    placement="top"
    arrow
    slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -80] } }] } }}>
    <IconButton
      onClick={onClick}
      size="small"
      sx={{
        color: enabled ? 'white' : '#f04747',
        transition: 'color .2s ease',
      }}
    >
      {enabled ? iconOn : iconOff}
    </IconButton>
  </Tooltip>
);

const useLocalToggle = (type: 'mic' | 'cam') => {
  const room = useRoomContext();
  const { showNotification } = useNotification();
  // version state just to trigger re-render
  const [, force] = useState(0);

  const enabled = type === 'mic'
    ? room?.localParticipant.isMicrophoneEnabled ?? false
    : room?.localParticipant.isCameraEnabled ?? false;

  const toggle = async () => {
    if (!room) return;
    try {
      if (type === 'mic') await room.localParticipant.setMicrophoneEnabled(!enabled);
      else await room.localParticipant.setCameraEnabled(!enabled);
    } catch (err: any) {
      showNotification(err?.message || 'Cannot access device', 'error');
    }
  };

  useEffect(() => {
    const lp = room?.localParticipant;
    if (!lp) return;
    const bump = () => force(v => v + 1);
    lp.on('trackMuted', bump);
    lp.on('trackUnmuted', bump);
    lp.on('trackPublished', bump);
    lp.on('trackUnpublished', bump);
    return () => {
      lp.off('trackMuted', bump);
      lp.off('trackUnmuted', bump);
      lp.off('trackPublished', bump);
      lp.off('trackUnpublished', bump);
    };
  }, [room, type]);

  return { enabled, toggle } as const;
};

const MicControl = () => {
  const { enabled, toggle } = useLocalToggle('mic');
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind: 'audioinput' });
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation(); // prevent toggle
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);

  const handleSelect = async (id: string) => {
    await setActiveMediaDevice(id);
    closeMenu();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <ToggleButton
        enabled={enabled}
        iconOn={<MicIcon />}
        iconOff={<MicOffIcon color="error" />}
        titleOn="Включить микрофон"
        titleOff="Выключить микрофон"
        onClick={toggle}
      />
      <Tooltip
        title="Устройства"
        placement="top"
        arrow
        slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -60] } }] } }}>
        <IconButton
          size="small"
          onClick={openMenu}
          sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: '#2f3136', p: '2px', '&:hover': { bgcolor: '#43454a' } }}
        >
          <ArrowDropDownIcon fontSize="inherit" sx={{ color: 'white', fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {devices.map((d: MediaDeviceInfo) => (
          <MenuItem key={d.deviceId} selected={d.deviceId === activeDeviceId} onClick={() => handleSelect(d.deviceId)}>
            {d.label || d.deviceId || 'Unknown'}
          </MenuItem>
        ))}
        {devices.length === 0 && <MenuItem disabled>Нет микрофонов</MenuItem>}
      </Menu>
    </Box>
  );
};

const CameraControl = () => {
  const { enabled, toggle } = useLocalToggle('cam');
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind: 'videoinput' });
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);
  const handleSelect = async (id: string) => {
    await setActiveMediaDevice(id);
    closeMenu();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <ToggleButton
        enabled={enabled}
        iconOn={<VideocamIcon />}
        iconOff={<VideocamOffIcon color="error" />}
        titleOn="Включить камеру"
        titleOff="Выключить камеру"
        onClick={toggle}
      />
      <Tooltip
        title="Устройства"
        placement="top"
        arrow
        slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -60] } }] } }}>
        <IconButton
          size="small"
          onClick={openMenu}
          sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: '#2f3136', p: '2px', '&:hover': { bgcolor: '#43454a' } }}
        >
          <ArrowDropDownIcon fontSize="inherit" sx={{ color: 'white', fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {devices.map((d: MediaDeviceInfo) => (
          <MenuItem key={d.deviceId} selected={d.deviceId === activeDeviceId} onClick={() => handleSelect(d.deviceId)}>
            {d.label || d.deviceId || 'Unknown'}
          </MenuItem>
        ))}
        {devices.length === 0 && <MenuItem disabled>Нет камер</MenuItem>}
      </Menu>
    </Box>
  );
};

const ScreenShareToggle = () => {
  const { toggle, enabled } = useScreenShare();
  return (
    <ToggleButton
      enabled={enabled}
      iconOn={<StopScreenShareIcon />}
      iconOff={<ScreenShareIcon />}
      titleOn="Остановить трансляцию экрана"
      titleOff="Поделиться экраном"
      onClick={toggle}
    />
  );
};

const SpeakerControl = () => {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind: 'audiooutput' });
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const listening = useServerStore((s) => (user?.id ? s.listeningStates[user.id] : true) ?? true);
  const setListeningState = useServerStore((s) => s.setListeningState);

  // keep actual audio elements in sync
  useEffect(() => {
    document.querySelectorAll('audio').forEach((el) => {
      (el as HTMLMediaElement).muted = !listening;
    });
  }, [listening]);

  const toggleListening = () => {
    if (!user) return;
    const newVal = !listening;
    setListeningState(user.id, newVal);
    socket?.emit('user:listening', newVal);
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);
  const handleSelect = async (id: string) => {
    await setActiveMediaDevice(id);
    closeMenu();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip
        title={listening ? 'Выключить звук' : 'Включить звук'}
        placement="top"
        arrow
        slotProps={{ popper: { modifiers:[{name:'offset',options:{offset:[0,-80]}}] } }}>
        <IconButton size="small" onClick={toggleListening} sx={{ color: listening ? 'white' : '#f04747' }}>
          {listening ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip
        title="Устройства"
        placement="top"
        arrow
        slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -60] } }] } }}>
        <IconButton
          size="small"
          onClick={openMenu}
          sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: '#2f3136', p: '2px', '&:hover': { bgcolor: '#43454a' } }}
        >
          <ArrowDropDownIcon fontSize="inherit" sx={{ color: 'white', fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {devices.map((d: MediaDeviceInfo) => (
          <MenuItem key={d.deviceId} selected={d.deviceId === activeDeviceId} onClick={() => handleSelect(d.deviceId)}>
            {d.label || d.deviceId || 'Unknown'}
          </MenuItem>
        ))}
        {devices.length === 0 && <MenuItem disabled>Нет устройств</MenuItem>}
      </Menu>
    </Box>
  );
};

export const VoiceControlBar: React.FC<VoiceControlBarProps> = ({ onDisconnect }) => {
  const room = useRoomContext();
  const { selectServer } = useServer();

  const leave = () => {
    room?.disconnect();
    selectServer(null);
    onDisconnect?.();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center'}}>
      <Box
        sx={{
          bgcolor: '#1e1f22',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          borderRadius: 2,
          pt: 1,
          pb: 1,
          border: '1px solid #2f3136',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', justifyContent: 'center', minWidth: 220, '& ul': { listStyle: 'none', p: 0, m: 0 } }}>
          <MicControl />
          <SpeakerControl />
          <CameraControl />   
          <ScreenShareToggle />
          <Tooltip title="Выйти из комнаты" placement="top" arrow slotProps={{ popper: { modifiers:[{name:'offset',options:{offset:[0,-80]}}] } }}>
            <IconButton
              onClick={leave}
              size="small"
              sx={{ color: '#f04747', transition: 'color .2s', '&:hover': { color: '#ff7878' } }}
            >
              <CallEndIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}; 