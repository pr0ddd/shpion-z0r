import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import {
  useTrackToggle,
  useDisconnectButton,
  useRoomContext,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import { useServer } from '@shared/hooks';
import { useScreenShare } from '@shared/livekit';
import { StreamSettingsDialog } from './StreamSettingsDialog';

export const MediaControlBar = () => {
  const { selectServer } = useServer();
  const { buttonProps: micButtonProps, track: micTrack } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  const isMicMuted = !micTrack || micTrack.isMuted;

  const { buttonProps: cameraButtonProps, track: cameraTrack } = useTrackToggle({
    source: Track.Source.Camera,
  });
  const isCameraMuted = !cameraTrack || cameraTrack.isMuted;

  const { toggle: toggleScreen, enabled: isScreenShareEnabled } = useScreenShare();

  const [dialogOpen, setDialogOpen] = React.useState(false);

  const room = useRoomContext();
  const isConnected = room?.state === ConnectionState.Connected;

  const handleScreenShareClick = () => {
    if (!isConnected) return;

    if (isScreenShareEnabled) {
      toggleScreen();
    } else {
      setDialogOpen(true);
    }
  };

  const { buttonProps: disconnectButtonProps } = useDisconnectButton({});

  const handleDisconnect = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disconnectButtonProps.onClick) {
      disconnectButtonProps.onClick(e);
    }
    selectServer(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '0.5rem 1rem',
        borderRadius: '12px',
      }}
    >
      <Tooltip title={isMicMuted ? 'Включить микрофон' : 'Выключить микрофон'}>
        <IconButton {...micButtonProps} color="default" sx={{ color: isMicMuted ? '#f44336' : 'white' }}>
          {isMicMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title={isCameraMuted ? 'Включить камеру' : 'Выключить камеру'}>
        <IconButton {...cameraButtonProps} color="default" sx={{ color: isCameraMuted ? '#f44336' : 'white' }}>
          {isCameraMuted ? <VideocamOffIcon /> : <VideocamIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title={isScreenShareEnabled ? 'Остановить демонстрацию' : 'Поделиться экраном'}>
        <IconButton onClick={handleScreenShareClick} color="default" disabled={!isConnected}
          sx={{ color: isScreenShareEnabled ? '#4caf50' : 'white' }}>
          {isScreenShareEnabled ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Покинуть комнату">
        <IconButton onClick={handleDisconnect} color="default" sx={{ color: '#f44336' }}>
          <CallEndIcon />
        </IconButton>
      </Tooltip>

      <StreamSettingsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onConfirm={toggleScreen} />
    </Box>
  );
}; 