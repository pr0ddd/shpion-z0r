import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { messageAPI } from '../services/api';

interface MessageInputProps {
  serverId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ serverId }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await messageAPI.sendMessage(serverId, inputValue);
      setInputValue(''); // Clear input on successful send
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optionally, show an error to the user
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Написать сообщение...`}
          autoComplete="off"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          InputProps={{
            endAdornment: (
              <IconButton type="submit" color="primary" disabled={!inputValue.trim() || isSending}>
                {isSending ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            ),
          }}
        />
      </form>
    </Box>
  );
};

export default MessageInput; 