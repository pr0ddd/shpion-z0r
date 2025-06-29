import React from 'react';
import { Box, ListItem, ListItemAvatar, Avatar, Typography, CircularProgress, Chip } from '@mui/material';
import { useAuth } from '@features/auth';
import { Message } from '@shared/types';
import { Interweave } from 'interweave';
import { dicebearAvatar } from '@shared/lib';

interface ChatMessageProps {
  message: Message;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }: ChatMessageProps) => {
    const { user } = useAuth();
    const isMe = message.authorId === user?.id;
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <ListItem sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                {!isMe && (
                    <ListItemAvatar sx={{ minWidth: 'auto', alignSelf: 'flex-end' }}>
                        <Avatar alt={message.author?.username} src={message.author?.avatar || dicebearAvatar(message.authorId)} sx={{ width: 32, height: 32 }}/>
                    </ListItemAvatar>
                )}
                <Box
                    sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: '20px',
                        backgroundColor: (theme) => {
                            const chatPalette = (theme as any).palette.chat;
                            if ((message as any).status === 'thinking') return chatPalette.theirMessage + '40'; // light grey
                            return isMe ? chatPalette.myMessage : chatPalette.theirMessage;
                        },
                        maxWidth: '60ch',
                    }}
                >
                    {!isMe && (
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 0.75 }}>
                           <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', textAlign: isMe ? 'right' : 'left' }}>
                             {message.author?.username || (isMe ? 'Я' : 'Неизвестный')}
                           </Typography>
                           {message.status === 'failed' && (
                             <Chip
                               label="ошибка"
                               color="error"
                               size="small"
                               variant="outlined"
                               component="span"
                               clickable={false}
                               sx={{
                                 fontSize: '0.65rem',
                                 height: 16,
                                 lineHeight: '16px',
                                 px: 0.5,
                                 py: 0,
                                 display: 'flex',
                                 alignItems: 'center',
                                 pointerEvents: 'none',
                               }}
                             />
                           )}
                         </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Typography component="div" variant="body1" sx={{
                          color: 'chat.textPrimary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          overflowX: 'hidden',
                        }}>
                           <Interweave content={message.content} />
                           {(message as any).status === 'thinking' && (
                             <CircularProgress size={12} sx={{ ml: 0.5 }} />
                           )}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'chat.textSecondary', ml: 1, alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
                            {time}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </ListItem>
    );
};

export const ChatMessage = React.memo(ChatMessageComponent); 