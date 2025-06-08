import React from 'react';
import { Box, Typography } from '@mui/material';
import { useServer } from '../contexts/ServerContext';
import { ScreenShareButton } from './ScreenShareButton';
import { ScreenShareViewer } from './ScreenShareViewer';

export default function ServerContent() {
  const { selectedServer } = useServer();

  if (!selectedServer) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Выберите сервер из списка слева
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Voice Controls Area */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>
          🎤 Голосовой чат: {selectedServer.name}
        </Typography>
        <ScreenShareButton />
      </Box>
      
      {/* Main Content Area with Screen Shares */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <ScreenShareViewer />
        
        {/* Основной контент чата/текста будет здесь */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            💬 Здесь будет основной чат и контент сервера
          </Typography>
        </Box>
      </Box>
    </Box>
  );
} 