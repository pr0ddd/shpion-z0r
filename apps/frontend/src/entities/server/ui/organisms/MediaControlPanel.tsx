import React from 'react';
import { Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import LogoutIcon from '@mui/icons-material/Logout';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useServerStore } from '@entities/server/model';
import { Chip } from '@ui/atoms/Chip';
import { IconButton } from '@ui/atoms/IconButton';
import { SettingsDialog, useSettingsDialogStore, GlobalHotkeys } from '@entities/settings';

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
        {/* Chat controls migrated to sidebar – no floating chat button needed anymore */}
        <ToggleMicButton />
        <ToggleVolumeButton />
        <SettingsButton />
        <LeaveButton />
        <SettingsDialog />
        <GlobalHotkeys />
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

export const SettingsButton: React.FC = () => {
  const isOpen = useSettingsDialogStore((s) => s.isOpen);
  const toggle = useSettingsDialogStore((s) => s.toggle);

  return (
    <IconButton
      hasBorder={true}
      color={isOpen ? 'primary' : 'default'}
      icon={<SettingsIcon />}
      tooltip={isOpen ? 'Скрыть настройки' : 'Настройки'}
      onClick={toggle}
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
