import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@shared/types';

import { useAppStore } from '../../../stores/useAppStore';
import { useAuth } from '@features/auth';
import { useSocket } from '@features/socket';
import { patchFirstMessagesPage } from '@shared/hooks';

/**
 * MessageComposer – textarea + send-button для ввода и отправки сообщений.
 * Подходит как чатовая нижняя панель. Зависит только от {@link useServer}
 * (чтобы знать выбранный сервер и вызвать sendMessage).
 */
export const MessageComposer: React.FC = () => {
  const serverId = useAppStore((s) => s.selectedServerId);
  const qc = useQueryClient();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // keep track of pending timeout IDs so we can clear them on unmount
  const pendingTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-focus при монтировании
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSend = () => {
    const value = text.trim();
    if (!value || !serverId) return;

    // optimistic update: insert temp message into cache
    const clientNonce = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const tempId = `temp_${clientNonce}`;
    const optimistic: Message = {
      id: tempId,
      content: value,
      authorId: user?.id ?? 'me',
      serverId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: user ? { id: user.id, username: user.username, avatar: user.avatar } as any : undefined,
    } as Message;

    patchFirstMessagesPage(qc, serverId, (msgs: Message[])=>[...msgs, optimistic]);

    // send via socket
    if (socket?.connected) {
      socket.emit('message:send', { serverId, content: value, clientNonce } as any, (ack: { success: boolean }) => {
        if (ack.success) {
          // real message will arrive via 'message:new'; remove temp if still there after timeout fallback.
          const tid = setTimeout(() => {
            patchFirstMessagesPage(qc, serverId, (arr: Message[])=> arr.filter((m)=> m.id !== tempId));
          }, 4000);
          pendingTimeouts.current.push(tid);
        } else {
          // ack fail: mark failed
          patchFirstMessagesPage(qc, serverId, (arr: Message[])=> arr.map((m: Message)=> m.id===tempId? { ...m, status:'failed'} as Message : m));
        }
      });
    }
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

  // clear all pending timeouts on unmount to avoid leaks
  useEffect(() => {
    return () => {
      pendingTimeouts.current.forEach(clearTimeout);
      pendingTimeouts.current = [];
    };
  }, []);

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
          placeholder={serverId ? 'Написать сообщение' : 'Выберите канал'}
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