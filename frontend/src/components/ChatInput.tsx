import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Popper, ClickAwayListener } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoodIcon from '@mui/icons-material/Mood';
import { useServer } from '../contexts/ServerContext';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const ChatInput = () => {
    const { selectedServer, sendMessage } = useServer();
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiButtonRef = useRef(null);

    useEffect(() => {
        if (!showEmojiPicker) {
            inputRef.current?.focus();
        }
    }, [showEmojiPicker]);

    const handleEmojiSelect = (emojiData: { native: string }) => {
        setInputValue(prev => prev + emojiData.native);
        setShowEmojiPicker(false);
    };

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
                <IconButton ref={emojiButtonRef} sx={{ p: '10px', color: 'chat.inputPlaceholder' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
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
                    <SendIcon />
                </IconButton>
            </Box>
            <Popper
                open={showEmojiPicker}
                anchorEl={emojiButtonRef.current}
                placement="top-start"
                sx={{ zIndex: 10 }}
            >
                <ClickAwayListener onClickAway={() => setShowEmojiPicker(false)}>
                    <div>
                        <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                    </div>
                </ClickAwayListener>
            </Popper>
        </Box>
    );
};

export default ChatInput; 