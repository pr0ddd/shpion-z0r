import React from 'react';
import { Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import LogoutIcon from '@mui/icons-material/Logout';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MonitorIcon from '@mui/icons-material/Monitor';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useServerStore } from '@entities/server/model';
import { Chip } from '@ui/atoms/Chip';
import { IconButton } from '@ui/atoms/IconButton';
import { useSessionStore } from '@entities/session';

interface MediaControlPanelProps {}

export const MediaControlPanel: React.FC<MediaControlPanelProps> = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        backgroundColor: 'new.card',
        borderTop: '1px solid',
        borderColor: 'new.border',
        padding: 1,
        paddingLeft: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          flex: 1,
        }}
      >
        <Chip label="Connected" variant="filled" color="primary" />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <ToggleScreenShareButton />
        <ToggleMicButton />
        <ToggleVolumeButton />
        <ToggleCameraButton />
        <SettingsButton />
        <LeaveButton />
      </Box>
    </Box>
  );
};

const ToggleMicButton: React.FC = () => {
  const { isMicEnabled, toggleMicEnabled } = useLocalParticipantMic();

  return (
    <IconButton
      hasBorder={true}
      color={isMicEnabled ? 'default' : 'error'}
      icon={isMicEnabled ? <MicIcon /> : <MicOffIcon />}
      tooltip={isMicEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
      onClick={toggleMicEnabled}
    />
  );
};

const ToggleVolumeButton: React.FC = () => {
  const { isVolumeEnabled, toggleVolumeEnabled } = useLocalParticipantVolume();

  return (
    <IconButton
      hasBorder={true}
      color={isVolumeEnabled ? 'default' : 'error'}
      icon={isVolumeEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
      tooltip={isVolumeEnabled ? 'Выключить звук' : 'Включить звук'}
      onClick={toggleVolumeEnabled}
    />
  );
};

const ToggleCameraButton: React.FC = () => {
  const { isCameraEnabled, toggleCameraEnabled } = useLocalParticipantCamera();

  return (
    <IconButton
      hasBorder={true}
      // color={isCameraEnabled ? 'default' : 'error'}
      icon={isCameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
      tooltip={isCameraEnabled ? 'Выключить камеру' : 'Включить камеру'}
      onClick={toggleCameraEnabled}
    />
  );
};

export const ToggleScreenShareButton: React.FC = () => {
  const user = useSessionStore(s => s.user);
  const { startNew } = useScreenShare();

  return (
    <IconButton
      hasBorder={true}
      icon={<MonitorIcon />}
      tooltip="Запустить трансляцию экрана"
      onClick={() => startNew(user?.id ?? '')}
    />
  );
};

export const SettingsButton: React.FC = () => {
  return (
    <IconButton
      hasBorder={true}
      color="default"
      icon={<SettingsIcon />}
      tooltip="Настройки"
      onClick={() => {}}
    />
  );
};

export const LeaveButton: React.FC = () => {
  const { setSelectedServerId } = useServerStore();

  return (
    <IconButton
      hasBorder={true}
      color="error"
      icon={<LogoutIcon />}
      tooltip="Выйти из комнаты"
      onClick={() => setSelectedServerId(null)}
    />
  );
};
