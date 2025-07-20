import React from 'react';
import { Box, Menu, MenuItem } from '@mui/material';
import { Message } from '@shared/types';
import { useGalleryStore } from '../../model/imageGallery.store';
import { useDeleteMessageMutation } from '../../api/deleteMessage.mutation';

interface Props {
  messages: Message[]; // images only
  isMine: boolean;
  serverId: string;
  onImageClick: (url: string) => void;
  onAllLoaded?: ()=>void;
}

export const ChatImageCollage: React.FC<Props> = ({ messages, isMine, serverId, onImageClick, onAllLoaded }) => {

  const { mutate: deleteMsg } = useDeleteMessageMutation(serverId);

  const [context, setContext] = React.useState<null | { mouseX: number; mouseY: number; messageId: string }>(null);

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    if (!isMine) return;
    e.preventDefault();
    setContext({ mouseX: e.clientX - 2, mouseY: e.clientY - 4, messageId });
  };

  const handleClose = () => setContext(null);

  const handleDelete = () => {
    if (context) deleteMsg(context.messageId);
    handleClose();
  };

  const images = messages.map(m => {
    const isPrefixed = (m.attachment as string).startsWith('/api/upload/file');
    return isPrefixed ? (m.attachment as string) : `/api/upload/file/${encodeURIComponent(m.attachment as string)}`;
  });

  const handleClick = (index: number) => onImageClick(images[index]);

  // Determine column count: up to 2 columns for 1-3 images, 3 for 4+, mirrors Telegram look
  const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : 2;

  const size = images.length === 1 ? 180 : 200; // smaller overall width

  const [loaded, setLoaded] = React.useState<boolean[]>(Array(images.length).fill(false));

  const markLoaded = (i:number)=> setLoaded(prev=>{const arr=[...prev]; arr[i]=true; return arr;});

  React.useEffect(()=>{
    if(onAllLoaded && loaded.every(Boolean)) onAllLoaded();
  },[loaded]);

  return (
    <>
      <Box
        sx={{
          width: size,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 0.5,
          cursor: 'pointer',
          ml: isMine ? 'auto' : undefined,
          mr: !isMine ? 'auto' : undefined,
        }}
        onClick={() => handleClick(0)}
      >
        {images.map((src, idx) => (
          <Box key={idx} sx={{ position:'relative', width:'100%', height:'100%' }}
            onContextMenu={(e)=>handleContextMenu(e, messages[idx].id)}>
            <Box
              component="img"
              src={src}
              onLoad={()=>markLoaded(idx)}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(idx);
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {!loaded[idx] && (
              <Box
                sx={{
                  position:'absolute', inset:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  backgroundColor:'new.card',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.4"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {isMine && (
        <Menu
          open={Boolean(context)}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={context ? { top: context.mouseY, left: context.mouseX } : undefined}
        >
          <MenuItem onClick={handleDelete}>Удалить</MenuItem>
        </Menu>
      )}
    </>
  );
}; 