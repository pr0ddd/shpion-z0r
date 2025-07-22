import React from 'react';
import { Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import LogoutIcon from '@mui/icons-material/Logout';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SettingsIcon from '@mui/icons-material/Settings';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useServerStore } from '@entities/server/model';
import { SettingsDialog, useSettingsDialogStore, GlobalHotkeys } from '@entities/settings';
import { useTheme } from '@mui/material';

interface MediaControlPanelProps {}

export const MediaControlPanel: React.FC<MediaControlPanelProps> = () => {
  /* --- hooks for each control --- */
  const { isMicEnabled, toggleMicEnabled } = useLocalParticipantMic();
  const { isVolumeEnabled, toggleVolumeEnabled } = useLocalParticipantVolume();
  const isSettingsOpen = useSettingsDialogStore((s) => s.isOpen);
  const toggleSettings = useSettingsDialogStore((s) => s.toggle);

  /* Stop All logic */
  const { stopAll: stopAllScreenShare } = useScreenShare();
  const { toggleCameraEnabled, isCameraEnabled } = useLocalParticipantCamera();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const handleStopAll = () => {
    stopAllScreenShare();
    if (room && localParticipant) {
      localParticipant.trackPublications.forEach((pub) => {
        if (pub.source === Track.Source.Camera && pub.track) {
          room.localParticipant.unpublishTrack(pub.track);
          pub.track.stop();
        }
      });
    }
    if (isCameraEnabled) toggleCameraEnabled();
  };

  const { setSelectedServerId } = useServerStore();

  const theme = useTheme();

  /* --- helper to render a button in unified style --- */
  const btnStyle = (addRightBorder: boolean) => ({
    flex: 1,
    backgroundColor: 'unset',
    border: 'none',
    borderRight: addRightBorder ? '1px solid' : 'none',
    borderRightColor: 'new.border',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    height: '45px',
    outline: 'none',
    '& svg': { color: 'new.foreground', fontSize: 16 },
    '&:hover': {
      backgroundColor: 'new.redLight',
    },
    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
  });

  const buttons = [
    {
      icon: isMicEnabled ? <MicIcon /> : <MicOffIcon />,
      label: 'Mic',
      onClick: toggleMicEnabled,
    },
    {
      icon: isVolumeEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />,
      label: 'Vol',
      onClick: toggleVolumeEnabled,
    },
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      onClick: toggleSettings,
    },
    {
      icon: <DesktopAccessDisabledIcon />,
      label: 'Stop',
      onClick: handleStopAll,
    },
    {
      icon: <LogoutIcon />,
      label: 'Exit',
      onClick: () => setSelectedServerId(null),
    },
  ];

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      {buttons.map((b, idx) => (
        <Box
          key={idx}
          component="button"
          onClick={b.onClick}
          sx={btnStyle(idx !== buttons.length - 1)}
        >
          {b.icon}
        </Box>
      ))}
      {/* Dialogs / helpers */}
      <SettingsDialog />
      <GlobalHotkeys />
    </Box>
  );
};
