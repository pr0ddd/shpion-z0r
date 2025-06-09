import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface VoiceControlsProps {
  onDisconnect: () => void;
}

const MicrophoneToggle = () => {
  const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.Microphone });
  const isMuted = !enabled;

  return (
    <Tooltip title={isMuted ? "Unmute" : "Mute"}>
      {/* We explicitly pass only the necessary props to avoid type conflicts */}
      <IconButton 
        onClick={buttonProps.onClick} 
        disabled={buttonProps.disabled}
        size="small"
      >
        {isMuted ? <MicOffIcon color="error" /> : <MicIcon />}
      </IconButton>
    </Tooltip>
  );
};

export const VoiceControls: React.FC<VoiceControlsProps> = ({ onDisconnect }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
        Voice Connected
      </Typography>
      
      <MicrophoneToggle />

      <Tooltip title="Disconnect">
        <IconButton onClick={onDisconnect} color="error" size="small">
          <CallEndIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}; 