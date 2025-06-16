import React from 'react';
import { Box } from '@mui/material';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export const CustomChat = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'chat.background', color: 'chat.textPrimary' }}>
            <MessageList />
            <ChatInput />
        </Box>
    );
}; 