import React from 'react';
import {
  Box,
  ListItem,
  ListItemAvatar,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useSessionStore } from '@entities/session';
import { Message } from '@shared/types';
import { Interweave } from 'interweave';
import { dicebearAvatar } from '@libs/dicebearAvatar';
import { ErrorOutline } from '@mui/icons-material';
import { Avatar } from '@ui/atoms/Avatar';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
}: ChatMessageProps) => {
  const user = useSessionStore(s => s.user);
  const isMe = message.authorId === user?.id;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ListItem
      sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          flexDirection: isMe ? 'row-reverse' : 'row',
        }}
      >
        {!isMe && (
          <ListItemAvatar sx={{ minWidth: 'auto', alignSelf: 'flex-end' }}>
            <Avatar
              src={message.author?.avatar || dicebearAvatar(message.authorId)}
            />
          </ListItemAvatar>
        )}
        <Box
          sx={{
            p: 1,
            borderRadius: 1,
            backgroundColor: (theme) => {
              const chatPalette = (theme as any).palette.chat;
              if ((message as any).status === 'thinking')
                return chatPalette.theirMessage + '40'; // light grey
              return isMe ? chatPalette.myMessage : chatPalette.theirMessage;
            },
            maxWidth: '60ch',
          }}
        >
          {!isMe && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 0.75 }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: 'text.secondary',
                  textAlign: isMe ? 'right' : 'left',
                }}
              >
                {message.author?.username || 'Неизвестный'}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <Typography
              component="div"
              variant="body1"
              sx={{
                color: 'chat.textPrimary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                overflowX: 'hidden',
              }}
            >
              {message.status === 'failed' && (
                <ErrorOutline sx={{ fontSize: 24, color: 'error.main' }} />
              )}
              <Interweave content={message.content} />
              {(message as any).status === 'thinking' && (
                <CircularProgress size={12} sx={{ ml: 0.5 }} />
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'chat.textSecondary',
                ml: 1,
                alignSelf: 'flex-end',
                whiteSpace: 'nowrap',
              }}
            >
              {time}
            </Typography>
          </Box>
        </Box>
      </Box>
    </ListItem>
  );
};
