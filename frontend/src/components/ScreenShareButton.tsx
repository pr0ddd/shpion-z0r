import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { ScreenShare as ScreenShareIcon, StopScreenShare as StopScreenShareIcon } from '@mui/icons-material';
import { useServer } from '../contexts/ServerContext';

export const ScreenShareButton: React.FC = () => {
  const { isScreenSharing, startScreenShare, stopScreenShare, room, currentQualityInfo } = useServer();

  const handleClick = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  // Не показываем кнопку если нет подключения к комнате
  if (!room) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        variant={isScreenSharing ? 'contained' : 'outlined'}
        color={isScreenSharing ? 'secondary' : 'primary'}
        onClick={handleClick}
        startIcon={isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        sx={{
          minWidth: 150,
          backgroundColor: isScreenSharing ? '#f44336' : undefined,
          '&:hover': {
            backgroundColor: isScreenSharing ? '#d32f2f' : undefined,
          }
        }}
      >
        {isScreenSharing ? 'Остановить' : 'Поделиться экраном'}
      </Button>
      
      {isScreenSharing && (
        <Typography variant="body2" color="text.secondary">
          🔴 {currentQualityInfo || 'Адаптивное качество (до Full HD 60fps)'}
        </Typography>
      )}
    </Box>
  );
}; 