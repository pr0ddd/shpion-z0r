import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import { useLocalParticipantMic } from '@entities/members/model/useLocalParticipantMic';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipantVolume } from '@entities/members/model/useLocalParticipantVolume';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useServerStore } from '@entities/server/model';

interface MediaControlPanelProps {
  onDisconnect?: () => void;
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
    slotProps={{
      popper: {
        modifiers: [{ name: 'offset', options: { offset: [0, -80] } }],
      },
    }}
  >
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

const DeviceControl: React.FC<{
  enabled: boolean;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  titleOn: string;
  titleOff: string;
  onClick: () => void;
}> = ({ enabled, iconOn, iconOff, titleOn, titleOff, onClick }) => {
  return (
    <ToggleButton
      enabled={enabled}
      iconOn={iconOn}
      iconOff={iconOff}
      titleOn={titleOn}
      titleOff={titleOff}
      onClick={onClick}
    />
  );
};

export const MediaControlPanel: React.FC<MediaControlPanelProps> = () => {
  const { setSelectedServerId } = useServerStore();
  const { isMicEnabled, toggleMicEnabled } = useLocalParticipantMic();
  const { isVolumeEnabled, toggleVolumeEnabled } = useLocalParticipantVolume();
  const { isCameraEnabled, toggleCameraEnabled } = useLocalParticipantCamera();
  const { shares, count: screenSharesCount, startNew, stopShare, stopAll } = useScreenShare();

  const leave = () => {
    setSelectedServerId(null);
    // room?.disconnect();
    // selectServer(null);
    // onDisconnect?.();
  };

  return (
    <Box
      sx={{
        bgcolor: '#1e1f22',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        borderRadius: 2,
        pt: 1,
        pb: 1,
        border: '1px solid #2f3136',
      }}
    >
      <DeviceControl
        enabled={isMicEnabled}
        iconOn={<MicIcon />}
        iconOff={<MicOffIcon color="error" />}
        titleOn="Включить микрофон"
        titleOff="Выключить микрофон"
        onClick={toggleMicEnabled}
      />

      <DeviceControl
        enabled={isVolumeEnabled}
        iconOn={<VolumeUpIcon />}
        iconOff={<VolumeOffIcon color="error" />}
        titleOn="Включить звук"
        titleOff="Выключить звук"
        onClick={toggleVolumeEnabled}
      />

      <DeviceControl
        enabled={screenSharesCount === 0}
        iconOn={<ScreenShareIcon />}
        iconOff={<StopScreenShareIcon color="success" />}
        titleOn="Запустить трансляцию экрана"
        titleOff="Остановить трансляцию экрана"
        onClick={() => startNew()}
      />

      {/* <Tooltip title={count > 0 ? 'Управление трансляциями экрана' : 'Поделиться экраном'} placement="top" arrow>
        <IconButton onClick={handleButtonClick} size="small" sx={{ color: count > 0 ? '#4caf50' : 'white' }}>
          <Badge color="secondary" badgeContent={count > 0 ? count : undefined} overlap="circular">
            {count > 0 ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </Badge>
        </IconButton>
      </Tooltip> */}

      <DeviceControl
        enabled={isCameraEnabled}
        iconOn={<VideocamIcon />}
        iconOff={<VideocamOffIcon color="error" />}
        titleOn="Включить камеру"
        titleOff="Выключить камеру"
        onClick={toggleCameraEnabled}
      />

      {/* TODO: !!!!!! add screen share control */}
      {/* <ScreenShareControl />  */}

      <DeviceControl
        enabled={false}
        iconOn={null}
        iconOff={<CallEndIcon />}
        titleOn={''}
        titleOff="Выйти из комнаты"
        onClick={leave}
      />
    </Box>
  );
};
