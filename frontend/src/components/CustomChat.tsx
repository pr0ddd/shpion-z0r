import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Paper, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoodIcon from '@mui/icons-material/Mood';
import ErrorIcon from '@mui/icons-material/Error';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messageAPI } from '../services/api';

export const CustomChat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { selectedServer, messages, addMessage, setOptimisticMessageStatus } = useServer();
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setInputValue(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !selectedServer || !user || !socket) return;

        const tempId = `temp_${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            content: inputValue,
            authorId: user.id,
            serverId: selectedServer.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
            },
            status: 'sending' as const,
        };

        addMessage(optimisticMessage);
        
        socket.emit('message:send', { serverId: selectedServer.id, content: inputValue }, (ack: { success: boolean }) => {
            if (!ack.success) {
                setOptimisticMessageStatus(tempId, 'failed');
            }
            // On success, we do nothing. The broadcasted WebSocket event will handle the update.
        });

        setInputValue('');
        inputRef.current?.focus();
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#36393f', color: 'white' }}>
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {messages.map(msg => (
                    <ListItem 
                        key={msg.id} 
                        sx={{ 
                            alignItems: 'flex-start',
                            backgroundColor: msg.status === 'failed' ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            mb: 0.5
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar src={msg.author?.avatar || undefined} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {msg.author?.username || 'Unknown User'}
                                    </Typography>
                                    {msg.status === 'failed' && <ErrorIcon color="error" sx={{ fontSize: 16 }} />}
                                </Box>
                            }
                            secondary={
                                <Typography variant="body2" sx={{ color: msg.status === 'failed' ? '#ff8a80' : '#dcddde', whiteSpace: 'pre-wrap' }}>
                                    {msg.content}
                                </Typography>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                        />
                    </ListItem>
                ))}
                <div ref={messagesEndRef} />
            </List>
            <Box sx={{ p: 2, backgroundColor: '#40444b', position: 'relative' }}>
                <Paper component="form" sx={{ display: 'flex', alignItems: 'center', width: '100%', backgroundColor: '#2f3136' }}
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                >
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder={`Message in #${selectedServer?.name || 'server'}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        inputRef={inputRef}
                        sx={{ 
                            ml: 2, 
                            color: 'white',
                            '& .MuiInputBase-input': {
                                color: 'white',
                            },
                        }}
                        InputProps={{
                            disableUnderline: true,
                        }}
                    />
                    <IconButton onClick={() => setShowEmojiPicker(val => !val)}>
                        <MoodIcon sx={{ color: 'white' }} />
                    </IconButton>
                    <IconButton type="submit" sx={{ p: '10px' }} aria-label="send">
                        <SendIcon sx={{ color: 'white' }} />
                    </IconButton>
                </Paper>
                {showEmojiPicker && (
                    <Box sx={{ position: 'absolute', bottom: '80px', right: '20px' }}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </Box>
                )}
            </Box>
        </Box>
    );
}; 