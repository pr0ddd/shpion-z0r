import React from 'react';
import { Box, ListItem, ListItemAvatar, Avatar, Typography } from '@mui/material';
import { useAuth } from '@shared/hooks';
import { Message } from '@shared/types';
import { Interweave } from 'interweave';
import { dicebearAvatar } from '../lib/ui';

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
                            return isMe ? chatPalette.myMessage : chatPalette.theirMessage;
                        },
                        maxWidth: '70%',
                    }}
                >
                    {!isMe && (
                         <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 0.5, textAlign: isMe ? 'right' : 'left' }}>
                            {message.author?.username || (isMe ? 'Я' : 'Неизвестный')}
                         </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Typography component="div" variant="body1" sx={{ color: 'chat.textPrimary', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                           <Interweave content={message.content} />
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