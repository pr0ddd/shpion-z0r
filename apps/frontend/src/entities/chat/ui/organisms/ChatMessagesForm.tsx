import React from 'react';
import { Box } from '@mui/material';
import { Send } from '@mui/icons-material';

import { TextField } from '@ui/atoms/TextField';
import { IconButton } from '@ui/atoms/IconButton';

import { useServerStore } from '@entities/server/model';
import { useChatMessagesForm } from '@entities/chat/model/useChatMessagesForm';

/**
 * ChatMessagesForm – textarea + send-button для ввода и отправки сообщений.
 * Подходит как чатовая нижняя панель.
 */
export const ChatMessagesForm: React.FC = () => {
  const serverId = useServerStore((s) => s.selectedServerId)!;
  const { text, setText, inputRef, handleSubmit, handleKeyDown, doSend } =
    useChatMessagesForm(serverId);

  return (
    <Box
      sx={{
        p: 1,
        borderTop: '1px solid',
        borderColor: 'new.border',
        backgroundColor: 'new.card',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder={'Написать сообщение...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!serverId}
          inputRef={inputRef}
        />
        <IconButton
          icon={<Send />}
          color="primary"
          type="button"
          disabled={!text.trim() || !serverId}
          onClick={() => {
            doSend();
          }}
        />
      </Box>
    </Box>
  );
};
