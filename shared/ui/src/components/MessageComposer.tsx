import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useServer } from '@shared/hooks';

/**
 * MessageComposer – textarea + send-button для ввода и отправки сообщений.
 * Подходит как чатовая нижняя панель. Зависит только от {@link useServer}
 * (чтобы знать выбранный сервер и вызвать sendMessage).
 */
export const MessageComposer: React.FC = () => {
  const { selectedServer, sendMessage } = useServer();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus при монтировании
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSend = () => {
    const value = text.trim();
    if (!value) return;
    sendMessage(value);
    setText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  return (
    <Box sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.chat.border}`, flexShrink: 0, mt: 'auto' }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'chat.inputBackground',
          borderRadius: 1.5,
          p: '2px 4px',
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          placeholder={selectedServer ? `Написать в #${selectedServer.name}` : 'Выберите канал'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!selectedServer}
          multiline
          maxRows={4}
          inputRef={inputRef}
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-root': { p: 1 },
            '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
              borderBottom: 'none',
            },
          }}
        />
        <IconButton type="submit" sx={{ p: '10px', color: 'chat.inputPlaceholder' }} disabled={!text.trim()}>
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
}; 