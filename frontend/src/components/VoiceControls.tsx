import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { colors } from '../theme';

interface VoiceControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  toggleMute: () => void;
  toggleDeafen: () => void;
  isConnected: boolean;
  currentServerId: string | null;
  isInLobby: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  isMuted,
  isDeafened,
  toggleMute,
  toggleDeafen,
  isConnected,
  currentServerId,
  isInLobby,
}) => {
  const buttonStyle = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '50%',
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:hover::before': {
      opacity: 0.1,
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
  };

  const muteButtonStyle = {
    ...buttonStyle,
    backgroundColor: isMuted ? colors.accent.danger : colors.accent.success,
    color: 'white',
    '&::before': {
      backgroundColor: 'white',
    },
    '&:hover': {
      backgroundColor: isMuted ? '#e53e3e' : '#38a169',
      transform: 'scale(1.05)',
    },
  };

  const deafenButtonStyle = {
    ...buttonStyle,
    backgroundColor: isDeafened ? colors.accent.danger : colors.text.muted,
    color: 'white',
    '&::before': {
      backgroundColor: 'white',
    },
    '&:hover': {
      backgroundColor: isDeafened ? '#e53e3e' : '#718096',
      transform: 'scale(1.05)',
    },
  };

  const getStatusText = () => {
    if (isInLobby) {
      return 'В лобби';
    }
    if (isConnected && currentServerId) {
      return 'В голосовом чате';
    }
    if (currentServerId) {
      return 'Подключение...';
    }
    return 'Не подключен';
  };

  const getStatusColor = () => {
    if (isConnected) return colors.accent.success;
    if (currentServerId) return colors.accent.warning;
    return colors.text.muted;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        zIndex: 1000,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: 2,
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Status indicator */}
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: getStatusColor(),
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>

      {/* Voice controls */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Mute/Unmute button */}
        <Tooltip 
          title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
          placement="top"
        >
          <IconButton
            onClick={toggleMute}
            sx={muteButtonStyle}
            aria-label={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>

        {/* Deafen/Undeafen button */}
        <Tooltip 
          title={isDeafened ? 'Включить звук' : 'Выключить звук'}
          placement="top"
        >
          <IconButton
            onClick={toggleDeafen}
            sx={deafenButtonStyle}
            aria-label={isDeafened ? 'Включить звук' : 'Выключить звук'}
          >
            {isDeafened ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Keyboard shortcuts hint */}
      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: colors.text.muted,
            fontSize: '0.6rem',
          }}
        >
          Ctrl+M • Ctrl+D
        </Typography>
      </Box>
    </Box>
  );
};

export default VoiceControls; 