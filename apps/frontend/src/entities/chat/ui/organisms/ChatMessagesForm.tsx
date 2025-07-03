import React from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';

import { useServerStore } from '@entities/server/model';
import { useChatMessagesForm } from '@entities/chat/model/useChatMessagesForm';

/**
 * ChatMessagesForm – textarea + send-button для ввода и отправки сообщений.
 * Подходит как чатовая нижняя панель.
 */
export const ChatMessagesForm: React.FC = () => {
  const serverId = useServerStore((s) => s.selectedServerId)!;
  const { text, setText, inputRef, handleSubmit, handleKeyDown } =
    useChatMessagesForm(serverId);

  return (
    <Box
      sx={{
        p: 1,
        borderTop: (theme) => `1px solid ${theme.palette.border.main}`,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'chat.inputBackground',
          borderRadius: 1.5,
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          placeholder={'Написать'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!serverId}
          multiline
          maxRows={4}
          inputRef={inputRef}
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-root': { p: 1 },
            '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before':
              {
                borderBottom: 'none',
              },
          }}
        />
        <IconButton
          type="submit"
          sx={{ p: '10px', color: 'chat.inputPlaceholder' }}
          disabled={!text.trim() || !serverId}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};
