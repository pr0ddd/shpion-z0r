import React, { useState } from 'react';
import { useChat, useTracks } from '@livekit/components-react';
import { Box, TextField, IconButton, Paper, Typography, useTheme, Avatar, Collapse } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import ScreenShareDisplay from './ScreenShareDisplay';
import { Track } from 'livekit-client';

/* eslint-disable no-bitwise */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getContrastingTextColor = (hexColor: string): string => {
    if (hexColor.startsWith('#')) {
        hexColor = hexColor.slice(1);
    }
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

const ChatWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.default,
}));

const MessageList = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '16px',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
});

const MessageItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(2),
  alignItems: 'flex-start',
}));

const MessageContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  maxWidth: '80%',
  wordWrap: 'break-word',
}));

const ChatInputWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: 'transparent',
  flexShrink: 0,
}));

const CustomChat = () => {
    const theme = useTheme();
    const { chatMessages, send } = useChat();
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (inputValue.trim() && send) {
            send(inputValue);
            setInputValue('');
        }
    };

    return (
        <ChatWrapper>
            <MessageList>
                {chatMessages.map((msg, i) => {
                    const displayName = msg.from?.identity.split(':')[1] || msg.from?.identity || 'Unknown';
                    const initial = displayName.charAt(0).toUpperCase();
                    const bgColor = stringToColor(msg.from?.identity || 'default');
                    const textColor = getContrastingTextColor(bgColor);

                    return (
                        <MessageItem key={i}>
                            <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: bgColor, color: textColor }}>{initial}</Avatar>
                            <Box>
                                <Box display="flex" alignItems="center" mb={0.5}>
                                    <Typography variant="body1" fontWeight="bold" color={bgColor}>
                                        {displayName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>
                                        {format(msg.timestamp, 'HH:mm')}
                                    </Typography>
                                </Box>
                                <MessageContent elevation={0}>
                                    <Typography variant="body2" color="text.primary">{msg.message}</Typography>
                                </MessageContent>
                            </Box>
                        </MessageItem>
                    );
                })}
            </MessageList>
            <ChatInputWrapper>
                <form onSubmit={handleSubmit}>
                    <TextField
                        name="message"
                        fullWidth
                        variant="outlined"
                        placeholder={`Написать сообщение...`}
                        autoComplete="off"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.background.paper,
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                    borderColor: theme.palette.primary.main,
                                },
                            },
                        }}
                        InputProps={{
                            endAdornment: (
                                <IconButton type="submit" color="primary" disabled={!inputValue.trim()}>
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
    const theme = useTheme();
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);

    // Centralized deduplication logic
    const uniqueTracks = Array.from(
        new Map(screenShareTracks.map((trackRef) => [trackRef.participant.identity, trackRef])).values()
    );
    const isScreenSharing = uniqueTracks.length > 0;

    return (
        <Box sx={{ display: 'flex', height: '100%', flexGrow: 1, overflow: 'hidden' }}>
            <Collapse in={isScreenSharing} orientation="horizontal" timeout={300} easing="ease-in-out">
                 <Box sx={{
                    height: '100%',
                    width: '30vw',
                    borderRight: `1px solid ${theme.palette.background.paper}`
                }}>
                    <ScreenShareDisplay tracks={uniqueTracks} />
                </Box>
            </Collapse>
            <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                minWidth: 0,
            }}>
                <CustomChat />
            </Box>
        </Box>
    );
};

export default ServerContent;