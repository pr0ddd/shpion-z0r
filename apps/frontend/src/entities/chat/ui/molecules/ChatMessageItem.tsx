import React from 'react';
import {
  Box,
  ListItem,
  ListItemAvatar,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@features/auth';
import { Message } from '@shared/types';
import { Interweave } from 'interweave';
import { dicebearAvatar } from '@shared/lib';
import { ErrorOutline } from '@mui/icons-material';
import { Avatar } from '@ui/atoms/Avatar';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
}: ChatMessageProps) => {
  const { user } = useAuth();

  const isMine = !!user && (user.id === message.authorId || user.id === message.author?.id);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        gap: 1,
        py: 1,
        px: 2,
      }}
    >
      {/* Avatar – show only for others */}
      {!isMine && (
        <ListItemAvatar sx={{ minWidth: 'auto', mt: 0.5 }}>
          <Avatar
            src={message.author?.avatar || dicebearAvatar(message.authorId)}
            sx={{ width: 32, height: 32 }}
          />
        </ListItemAvatar>
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMine ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Header (only for others) */}
        {!isMine && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'new.foreground',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {message.author?.username || 'Неизвестный'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'new.mutedForeground',
                fontSize: '0.75rem',
              }}
            >
              {time}
            </Typography>
          </Box>
        )}

        {/* Message content */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: isMine ? 'new.primary' : 'new.card',
            border: '1px solid',
            borderColor: isMine ? 'new.primary' : 'new.border',
            maxWidth: '100%',
          }}
        >
          <Typography
            component="div"
            variant="body2"
            sx={{
              color: isMine ? 'new.primaryForeground' : 'new.foreground',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              overflowX: 'hidden',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {message.status === 'failed' && (
              <ErrorOutline sx={{ fontSize: 16, color: 'new.red' }} />
            )}
            <Interweave content={message.content} />
            {(message as any).status === 'thinking' && (
              <CircularProgress size={12} sx={{ ml: 0.5 }} />
            )}
          </Typography>
        </Box>

        {/* Time for my messages – align right under bubble */}
        {isMine && (
          <Typography
            variant="caption"
            sx={{
              color: 'new.mutedForeground',
              fontSize: '0.75rem',
              mt: 0.5,
            }}
          >
            {time}
          </Typography>
        )}
      </Box>
    </ListItem>
  );
};
