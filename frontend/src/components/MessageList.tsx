import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { Message } from '../types';

const MessageContainer = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column-reverse', // To show latest messages at the bottom
});

const MessageItemWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(2),
  alignItems: 'flex-start',
}));

const MessageContentWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  maxWidth: '80%',
  wordWrap: 'break-word',
}));

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <MessageContainer>
      {/* We map messages in reverse to keep the flex-direction trick working with new messages */}
      {[...messages].reverse().map((msg) => (
        <MessageItemWrapper key={msg.id}>
          <Avatar src={msg.author.avatar || undefined} sx={{ width: 40, height: 40, mr: 2 }} />
          <Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body1" fontWeight="bold">
                {msg.author.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>
                {format(new Date(msg.createdAt), 'HH:mm')}
              </Typography>
            </Box>
            <MessageContentWrapper elevation={0}>
              <Typography variant="body2" color="text.primary">
                {msg.content}
              </Typography>
            </MessageContentWrapper>
          </Box>
        </MessageItemWrapper>
      ))}
    </MessageContainer>
  );
};

export default MessageList; 