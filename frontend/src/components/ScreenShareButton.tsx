import React from 'react';
import { Button, Box } from '@mui/material';
import { 
  ScreenShare as ScreenShareIcon, 
  StopScreenShare as StopScreenShareIcon
} from '@mui/icons-material';
import { useServer } from '../contexts/ServerContext';

export const ScreenShareButton: React.FC = () => {
  const { isScreenSharing, startScreenShare, stopScreenShare, room } = useServer();

  const handleClick = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  if (!room) {
    return null;
  }
  
  return (
    <Box>
      <Button
        variant={isScreenSharing ? 'contained' : 'outlined'}
        color={isScreenSharing ? 'secondary' : 'primary'}
        onClick={handleClick}
        startIcon={isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        sx={{ minWidth: 220 }}
      >
        {isScreenSharing ? 'Остановить трансляцию' : 'Поделиться экраном'}
      </Button>
    </Box>
  );
}; 