import React from 'react';
import {
  Box,
  ListItem,
  ListItemAvatar,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import { useSessionStore } from '@entities/session';
import { Message } from '@shared/types';
import { Interweave } from 'interweave';
import { ErrorOutline } from '@mui/icons-material';
import { Avatar } from '@ui/atoms/Avatar';
import { extractYouTubeID } from '../../utils/isYouTubeUrl';
import { useDeleteMessageMutation } from '../../api/deleteMessage.mutation';
import { useReplyStore } from '../../model/reply.store';
import { useEditStore } from '../../model/edit.store';

interface ChatMessageProps {
  message: Message;
  serverId: string;
  onImageClick?: (url: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  serverId,
  onImageClick,
}: ChatMessageProps) => {
  const user = useSessionStore(s => s.user);
  const isMine = !!user && (user.id === message.authorId || user.id === message.author?.id);

  const { mutate: deleteMsg } = useDeleteMessageMutation(serverId);
  const setReply = useReplyStore(s=>s.setReply);

  const [context, setContext] = React.useState<null | { mouseX: number; mouseY: number }>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContext({ mouseX: e.clientX - 2, mouseY: e.clientY - 4 });
  };

  const handleClose = () => setContext(null);

  const handleDelete = () => {
    handleClose();
    deleteMsg(message.id);
  };

  const handleReply = () => {
    handleClose();
    setReply(message);
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const youtubeId = extractYouTubeID(message.content);
  const isImageAttachment = message.type === 'IMAGE';
  const noBubbleMedia = isImageAttachment || !!youtubeId;

  // Prepare attachment URL for files
  let fileDownloadUrl: string | undefined = undefined;
  if (message.type === 'FILE' && message.attachment) {
    const isPrefixed = message.attachment.startsWith('/api/upload/file');
    const base = isPrefixed ? message.attachment : `/api/upload/file/${encodeURIComponent(message.attachment)}`;
    const param = message.content ? `?name=${encodeURIComponent(message.content)}` : '';
    fileDownloadUrl = `${base}${param}`;
  }

  const prefixColor = isMine ? 'new.primaryForeground' : 'new.mutedForeground';
  const linkColor = isMine ? 'inherit' : '#4eaaff';

  const myGradient = 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(168,85,247,0.2) 100%)';
  const otherGradient = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';

  const [ytTitle, setYtTitle] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (youtubeId) {
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.title) setYtTitle(data.title);
        })
        .catch(() => {});
    }
  }, [youtubeId]);

  return (
    <ListItem
      sx={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        gap: 1,
        py: 1,
        px: 1,
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar – show only for others */}
      {!isMine && (
        <ListItemAvatar sx={{ minWidth: 'auto', mt: 0.5 }}>
          <Avatar
            src={message.author?.avatar || undefined}
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
              gap: 0.5,
              mb: 0.25,
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

        {/* Message bubble */}
        <Box
          sx={{
            p: noBubbleMedia ? 0 : 1,
            borderRadius: 1,
            background: noBubbleMedia ? 'transparent' : (isMine ? myGradient : otherGradient),
            border: 'none',
            maxWidth: '100%',
            ml: noBubbleMedia && isMine ? 'auto' : undefined,
          }}
        >
          {/* Reply preview inside bubble */}
          {message.replyTo && (
            <Box
              sx={{
                p: 0.5,
                mb: 0.5,
                borderLeft: '2px solid',
                borderColor: isMine ? 'rgba(255,255,255,0.5)' : '#4eaaff',
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderRadius: 0.5,
                maxWidth: '100%',
              }}
            >
              <Typography variant="caption" sx={{ color: 'new.foreground', fontWeight: 600 }}>
                {message.replyTo.author?.username || 'Автор'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'new.mutedForeground',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 260,
                  display: 'block',
                }}
              >
                {message.replyTo.content}
              </Typography>
            </Box>
          )}

          {/* Message content */}
          {/* Uploading file progress */}
          {message.status==='uploading' && message.type==='FILE' && (
            <Box sx={{ width:220 }}>
              <Typography variant="body2" sx={{ fontSize:'0.8rem', color:'new.foreground', mb:0.5 }}>
                Файл: {message.content || 'загрузка...'}
              </Typography>
              <Typography variant="caption" sx={{ color: prefixColor, mb:0.5 }}>
                {(message.uploadLoaded!/1048576).toFixed(1)} MB / {(message.uploadTotal!/1048576).toFixed(1)} MB
              </Typography>
              <Box sx={{ height:8, backgroundColor:'new.border', borderRadius:4, overflow:'hidden' }}>
                <Box sx={{ width:`${(message.uploadLoaded!/message.uploadTotal!)*100}%`, height:'100%', backgroundColor: isMine ? 'new.primaryForeground' : 'new.primary' }} />
              </Box>
            </Box>
          )}

          {message.attachment && message.status!=='uploading' && (()=>{
            const full = message.attachment;
            const filenameParam = message.type==='FILE' && message.content ? `?name=${encodeURIComponent(message.content)}` : '';
            const fullWithParam = fileDownloadUrl || `${full}${filenameParam}`;

            // for files always render download link
            return message.type === 'IMAGE' ? (
              <img
                src={fullWithParam}
                style={{ maxWidth: 200, borderRadius: 8, cursor: 'pointer' }}
                onClick={() => onImageClick?.(fullWithParam)}
                onContextMenu={handleContextMenu}
              />
            ) : (
              <Typography variant="body2" sx={{ fontSize:'0.875rem' }}>
                <Box component="span" sx={{ color: prefixColor }}>Файл: </Box>
                <Box component="a" href={fullWithParam} target="_blank" rel="noreferrer" download sx={{ color: linkColor, textDecoration:'underline' }}>
                  {message.content || 'скачать'}
                </Box>
              </Typography>
            );
          })()}
          {!message.attachment && !youtubeId && (
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
          )}

          {/* Edited label */}
          {new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 500 && (
            <Typography variant="caption" sx={{ color:'new.mutedForeground', fontSize:'0.65rem', mt:0.25, display:'block', textAlign:isMine?'right':'left' }}>
              (edited)
            </Typography>
          )}

          {/* YouTube preview */}
          {!message.attachment && youtubeId && (() => {
            const id = youtubeId;
            return (
              <Box sx={{ mt: 1, alignSelf: isMine ? 'flex-end' : 'flex-start', width:260 }}>
                {/* Title placeholder keeps constant height */}
                <Box sx={{ height: 24, mb: 0.5, overflow: 'hidden' }}>
                  {ytTitle ? (
                    <Typography
                      component="a"
                      href={message.content}
                      target="_blank"
                      rel="noreferrer"
                      variant="body2"
                      sx={{
                        color: 'new.foreground',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ytTitle}
                    </Typography>
                  ) : null}
                </Box>

                <Box
                  component="a"
                  href={message.content}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ display:'block', width:260, height:150, borderRadius:1, overflow:'hidden' }}
                  onContextMenu={handleContextMenu}
                >
                  <Box
                    component="img"
                    src={`/api/preview/youtube/${id}`}
                    width={260}
                    height={150}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display:'block'
                    }}
                  />
                </Box>
              </Box>
            );
          })()}
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

      {/* Context menu */}
      {context && (
        <Menu
          open={Boolean(context)}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={context ? { top: context.mouseY, left: context.mouseX } : undefined}
        >
            <MenuItem onClick={handleReply}>Ответить</MenuItem>
          {isMine && <MenuItem onClick={()=>{handleClose();useEditStore.getState().setEdit(message);}}>Изменить</MenuItem>}
          {isMine && <MenuItem onClick={handleDelete}>Удалить</MenuItem>}
        </Menu>
      )}
    </ListItem>
  );
};
