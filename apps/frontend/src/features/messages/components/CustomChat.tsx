import React from 'react';
import { Box } from '@mui/material';
import MessageList from './MessageList';
import { MessageComposer } from './MessageComposer';

export const CustomChat: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'chat.background', color: 'chat.textPrimary' }}>
      <MessageList />
      <MessageComposer />
    </Box>
  );
}; 