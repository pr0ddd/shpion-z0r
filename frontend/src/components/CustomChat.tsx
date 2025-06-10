import React, { useState, useRef, useEffect, useContext } from 'react';
import { Box, TextField, IconButton, List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Paper, CircularProgress, GlobalStyles } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoodIcon from '@mui/icons-material/Mood';
import ErrorIcon from '@mui/icons-material/Error';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import 'emoji-picker-element';

const scrollbarStyles = (
    <GlobalStyles
        styles={{
            '*::-webkit-scrollbar': {
                width: '8px',
            },
            '*::-webkit-scrollbar-track': {
                background: '#2f3136',
            },
            '*::-webkit-scrollbar-thumb': {
                backgroundColor: '#202225',
                borderRadius: '4px',
                border: '2px solid #2f3136',
            },
            '*::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#1a1b1e',
            },
        }}
    />
);

export const CustomChat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { selectedServer, messages, addMessage, setOptimisticMessageStatus } = useServer();
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Dynamically import and define the custom element
        import('emoji-picker-element');
    }, []);

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

    const submitMessage = () => {
        if (inputValue.trim() && selectedServer && user && socket) {
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
                    avatar: user.avatar
                },
                status: 'sending' as const
            };
            addMessage(optimisticMessage);
            socket.emit('message:send', { serverId: selectedServer.id, content: inputValue }, (ack: { success: boolean }) => {
                if (!ack.success) {
                    setOptimisticMessageStatus(tempId, 'failed');
                }
                // On success, we do nothing. The broadcasted WebSocket event will handle the update.
            });
            setInputValue('');
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        submitMessage();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
        }
    };

    return (
        <>
            {scrollbarStyles}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#36393f', color: 'white' }}>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                    <List>
                        {messages.map(msg => {
                            const isMe = msg.authorId === user?.id;
                            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <ListItem key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', p: 0, mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                        {!isMe && (
                                            <ListItemAvatar sx={{ minWidth: 'auto', alignSelf: 'flex-start' }}>
                                                <Avatar alt={msg.author?.username} src={msg.author?.avatar || undefined} sx={{ width: 40, height: 40 }}/>
                                            </ListItemAvatar>
                                        )}
                                        <Box
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: '20px',
                                                backgroundColor: isMe ? '#005c4b' : '#2f3136',
                                                maxWidth: '70%',
                                            }}
                                        >
                                            {!isMe && (
                                                 <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#8e9297', mb: 0.5 }}>
                                                    {msg.author?.username || 'Неизвестный'}
                                                 </Typography>
                                            )}
                                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <Typography component="p" variant="body1" sx={{ color: 'white', wordBreak: 'break-word', whiteSpace: 'pre-wrap', minWidth: '50px' }}>
                                                    {msg.content}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#8e9297', ml: 1, whiteSpace: 'nowrap' }}>
                                                    {time}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </ListItem>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </List>
                </Box>
                <Box sx={{ p: 2, borderTop: '1px solid #202225', flexShrink: 0, mt: 'auto' }}>
                    <Box 
                        component="form" 
                        onSubmit={handleSendMessage} 
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#40444b',
                            borderRadius: '6px',
                            p: '2px 4px',
                        }}
                    >
                        <IconButton sx={{ p: '10px', color: '#b9bbbe' }}>
                            <MoodIcon />
                        </IconButton>
                        <TextField
                            fullWidth
                            variant="standard"
                            placeholder={selectedServer ? `Написать в #${selectedServer.name}` : 'Выберите канал'}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={!selectedServer}
                            multiline
                            maxRows={4}
                            sx={{
                                color: '#dcddde',
                                flexGrow: 1,
                                '& .MuiInputBase-root': {
                                    padding: '8px',
                                },
                                '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                    borderBottom: 'none',
                                },
                                '& .MuiInputBase-input': { color: '#dcddde' }
                            }}
                        />
                         <IconButton type="submit" sx={{ p: '10px', color: '#b9bbbe' }} disabled={!inputValue.trim()}>
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
                {showEmojiPicker && (
                    <Box sx={{ position: 'absolute', bottom: '80px', right: '20px' }}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </Box>
                )}
            </Box>
        </>
    );
}; 