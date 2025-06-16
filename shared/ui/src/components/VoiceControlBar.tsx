import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faUpRightFromSquare,
  faCircleXmark,
  faPhoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useRoomContext } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { useScreenShare } from '@shared/hooks';
import { useServer } from '@shared/hooks';

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
  <Tooltip title={enabled ? titleOff : titleOn}>
    <IconButton
      onClick={onClick}
      size="small"
      sx={{
        color: enabled ? 'white' : '#f04747',
        transition: 'color .2s ease',
        '&:hover': { color: '#5865F2' },
      }}
    >
      {enabled ? iconOn : iconOff}
    </IconButton>
  </Tooltip>
);

const useLocalToggle = (type: 'mic' | 'cam') => {
  const room = useRoomContext();
  // version state just to trigger re-render
  const [, force] = useState(0);

  const enabled = type === 'mic'
    ? room?.localParticipant.isMicrophoneEnabled ?? false
    : room?.localParticipant.isCameraEnabled ?? false;

  const toggle = async () => {
    if (!room) return;
    if (type === 'mic') await room.localParticipant.setMicrophoneEnabled(!enabled);
    else await room.localParticipant.setCameraEnabled(!enabled);
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

const MicrophoneToggle = () => {
  const { enabled, toggle } = useLocalToggle('mic');
  return (
    <ToggleButton
      enabled={enabled}
      iconOn={<FontAwesomeIcon icon={faMicrophone} />}
      iconOff={<FontAwesomeIcon icon={faMicrophoneSlash} color="red" />}
      titleOn="Включить микрофон"
      titleOff="Выключить микрофон"
      onClick={toggle}
    />
  );
};

const CameraToggle = () => {
  const { enabled, toggle } = useLocalToggle('cam');
  return (
    <ToggleButton
      enabled={enabled}
      iconOn={<FontAwesomeIcon icon={faVideo} />}
      iconOff={<FontAwesomeIcon icon={faVideoSlash} color="red" />}
      titleOn="Включить камеру"
      titleOff="Выключить камеру"
      onClick={toggle}
    />
  );
};

const ScreenShareToggle = () => {
  const { toggle, enabled } = useScreenShare();
  return (
    <ToggleButton
      enabled={enabled}
      iconOn={<FontAwesomeIcon icon={faCircleXmark} />}
      iconOff={<FontAwesomeIcon icon={faUpRightFromSquare} />}
      titleOn="Остановить трансляцию экрана"
      titleOff="Поделиться экраном"
      onClick={toggle}
    />
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
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box
        sx={{
          bgcolor: '#1e1f22',
          borderRadius: 2,
          px: 2,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          border: '1px solid #2f3136',
        }}
      >
        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
          Voice Connected
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <MicrophoneToggle />
          <CameraToggle />
          <ScreenShareToggle />
          <Tooltip title="Выйти из комнаты">
            <IconButton
              onClick={leave}
              size="small"
              sx={{ color: '#f04747', transition: 'color .2s', '&:hover': { color: '#ff7878' } }}
            >
              <FontAwesomeIcon icon={faPhoneSlash} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}; 