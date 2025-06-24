import React from 'react';
import { Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { useRoomContext, useMediaDeviceSelect } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { useServer, useServerStore, useNotification, useSocket, useAuth, useAppStore } from '@shared/hooks';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ScreenShareControl } from './ScreenShareControl';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

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
  // small local feedback sound
  const playClick = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  };

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
      localStorage.setItem(`voice_${type}_enabled`, String(!enabled));
      playClick();
    } catch (err: any) {
      showNotification(err?.message || 'Cannot access device', 'error');
    }
  };

  // Apply saved mic/cam preference when (re)подключаемся к комнате
  useEffect(() => {
    if (!room) return;

    const applyPref = () => {
      const saved = localStorage.getItem(`voice_${type}_enabled`);
      if (saved === null) return;
      const desired = saved === 'true';
      const current = type === 'mic'
        ? room.localParticipant.isMicrophoneEnabled
        : room.localParticipant.isCameraEnabled;
      if (desired !== current) {
        if (type === 'mic') room.localParticipant.setMicrophoneEnabled(desired);
        else room.localParticipant.setCameraEnabled(desired);
      }
    };

    if (room.state === 'connected') applyPref();
    else room.once('connected', applyPref);

    return () => {
      room.off('connected', applyPref as any);
    };
  }, [room, type]);

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

// Generic menu-based device toggle (mic/cam)
const DeviceControl: React.FC<{
  type: 'mic' | 'cam';
  kind: 'audioinput' | 'videoinput';
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  titleOn: string;
  titleOff: string;
}> = ({ type, kind, iconOn, iconOff, titleOn, titleOff }) => {
  const { enabled, toggle } = useLocalToggle(type);
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });
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
        iconOn={iconOn}
        iconOff={iconOff}
        titleOn={titleOn}
        titleOff={titleOff}
        onClick={toggle}
      />
      <Tooltip
        title="Устройства"
        placement="top"
        arrow
        slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -60] } }] } }}
      >
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

const ScreenShareToggle = ScreenShareControl;

const SpeakerControl = () => {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind: 'audiooutput' });
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const room = useRoomContext();
  const selectedServerId = useAppStore(s=>s.selectedServerId);

  const listening = useServerStore((s) => (user?.id ? s.listeningStates[user.id] : true) ?? true);
  const setListeningState = useServerStore((s) => s.setListeningState);

  // Синхронизируем глобальный mute с LiveKit (глушит/восстанавливает все удалённые аудио-треки,
  // включая появившихся позже). Для этого меняем громкость у каждого RemoteParticipant.
  useEffect(() => {
    if (!room) return;

    const applyVolume = (p: RemoteParticipant) => p.setVolume(listening ? 1 : 0);
    const handleTrackSubscribed = (
      _track: any,
      _publication: any,
      participant: RemoteParticipant,
    ) => applyVolume(participant);

    // текущие участники
    room.remoteParticipants.forEach(applyVolume);

    // участники, которые подключатся позднее
    room.on(RoomEvent.ParticipantConnected, applyVolume);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed as any);

    return () => {
      room.off(RoomEvent.ParticipantConnected, applyVolume);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed as any);
    };
  }, [room, listening]);

  const toggleListening = () => {
    if (!user) return;
    const newVal = !listening;
    setListeningState(user.id, newVal);
    if(selectedServerId){
      socket?.emit('user:listening', { serverId: selectedServerId, listening: newVal } as any);
    }
    localStorage.setItem('voice_listening', String(newVal));
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 440;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {}
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

  useEffect(() => {
    if (!user || !socket || !room) return;
    const saved = localStorage.getItem('voice_listening');
    if (saved === null) return;
    const desired = saved === 'true';
    if (desired !== listening) {
      setListeningState(user.id, desired);
      if(selectedServerId){ socket.emit('user:listening', { serverId: selectedServerId, listening: desired } as any); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, socket, room]);

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

const MicControl = () => (
  <DeviceControl
    type="mic"
    kind="audioinput"
    iconOn={<MicIcon />}
    iconOff={<MicOffIcon color="error" />}
    titleOn="Включить микрофон"
    titleOff="Выключить микрофон"
  />
);

const CameraControl = () => (
  <DeviceControl
    type="cam"
    kind="videoinput"
    iconOn={<VideocamIcon />}
    iconOff={<VideocamOffIcon color="error" />}
    titleOn="Включить камеру"
    titleOff="Выключить камеру"
  />
);

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