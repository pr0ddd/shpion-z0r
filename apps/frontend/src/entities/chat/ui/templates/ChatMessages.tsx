import React from 'react';
import { Box } from '@mui/material';

import { ChatMessagesList } from '../organisms/ChatMessagesList';
import { ChatMessagesForm } from '../organisms/ChatMessagesForm';

export const ChatMessages: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100%',
      }}
    >
      <ChatMessagesList />
      <ChatMessagesForm />
    </Box>
  );
};
