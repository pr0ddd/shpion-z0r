import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useServer } from '@shared/hooks';

const ChatInput = () => {
    const { selectedServer, sendMessage } = useServer();
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submitMessage = () => {
        if (inputValue.trim()) {
            sendMessage(inputValue);
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
        <Box sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.chat.border}`, flexShrink: 0, mt: 'auto' }}>
            <Box 
                component="form" 
                onSubmit={handleSendMessage} 
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'chat.inputBackground',
                    borderRadius: '6px',
                    p: '2px 4px',
                }}
            >
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
                    inputRef={inputRef}
                    sx={{
                        color: 'text.primary',
                        flexGrow: 1,
                        '& .MuiInputBase-root': { padding: '8px' },
                        '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                            borderBottom: 'none',
                        },
                        '& .MuiInputBase-input': { color: 'text.primary' }
                    }}
                />
                 <IconButton type="submit" sx={{ p: '10px', color: 'chat.inputPlaceholder' }} disabled={!inputValue.trim()}>
                    <Send />
                </IconButton>
            </Box>
        </Box>
    );
};

export default ChatInput; 