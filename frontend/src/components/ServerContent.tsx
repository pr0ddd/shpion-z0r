import React from 'react';
import {
  ControlBar,
  useChat,
  ChatMessage,
  ChatEntry
} from '@livekit/components-react';
import { Box, TextField, IconButton, Paper, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';

const ChatWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const MessageList = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '8px',
});

const MessageItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
}));

const ChatInputWrapper = styled(Box)({
  padding: '8px',
  flexShrink: 0,
});

const CustomChat = () => {
    const { chatMessages, send } = useChat();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const message = event.currentTarget.message.value;
        if (message && send) {
            send(message);
            event.currentTarget.message.value = '';
        }
    };

    return (
        <ChatWrapper>
            <MessageList>
                {chatMessages.map((msg, i) => (
                    <MessageItem key={i}>
                        <Typography variant="caption" color="text.secondary">
                            {msg.from?.identity}
                        </Typography>
                        <Typography variant="body2">{msg.message}</Typography>
                    </MessageItem>
                ))}
            </MessageList>
            <ChatInputWrapper>
                <form onSubmit={handleSubmit}>
                    <TextField
                        name="message"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter a message..."
                        autoComplete="off"
                        InputProps={{
                            endAdornment: (
                                <IconButton type="submit" color="primary">
                                    <SendIcon />
                                </IconButton>
                            )
                        }}
                    />
                </form>
            </ChatInputWrapper>
        </ChatWrapper>
    );
}


const ServerContent = () => {
    return (
        <Box style={{ display: 'flex', height: '100%', flexGrow: 1 }}>
            {/* Main content with video and controls */}
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                {/* This is the empty main area now, it will push the control bar to the bottom */}
                <Box sx={{ flexGrow: 1 }} />
            </Box>

            {/* Right sidebar with members and chat */}
            <Box sx={{ 
                width: '25%', 
                minWidth: '280px',
                maxWidth: '360px',
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                flexShrink: 0,
                backgroundColor: 'discord.members_bg',
                borderLeft: '1px solid',
                borderColor: 'divider'
            }}>
                <CustomChat />
            </Box>
        </Box>
    );
};

export default ServerContent; 