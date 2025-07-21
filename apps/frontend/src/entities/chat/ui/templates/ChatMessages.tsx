import React from 'react';
import { Box } from '@mui/material';
import { useFileUpload } from '@entities/chat/model/useFileUpload';
import { useServerStore } from '@entities/server/model';
import { useSendMessageMutation } from '@entities/chat/api/sendMessage.mutation';

import { ChatMessagesList } from '../organisms/ChatMessagesList';
import { ChatMessagesForm } from '../organisms/ChatMessagesForm';
import { ImageGalleryViewer } from '../molecules/ImageGalleryViewer';

export const ChatMessages: React.FC = () => {
  const [drag, setDrag] = React.useState(false);
  const serverId = useServerStore(s=>s.selectedServerId)!;
  const { upload } = useFileUpload();
  const { mutate: sendMessage } = useSendMessageMutation(serverId);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const files = Array.from(e.dataTransfer.files || []);
    for (const file of files) {
      const { url, type } = await upload(file);
      const name = file.name;
      sendMessage(name, { attachment: url, type });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100%',
        position: 'relative',
      }}
      onDragOver={(e)=>{e.preventDefault(); setDrag(true);}}
      onDragEnter={(e)=>{e.preventDefault(); setDrag(true);}}
      onDragLeave={(e)=>{e.preventDefault(); setDrag(false);}}
      onDrop={handleDrop}
    >
      {drag && (
        <Box sx={{
          position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.3)', border:'2px dashed #4eaaff', zIndex:10,
          display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'
        }}>
          <Box sx={{color:'#4eaaff', fontSize:'1.2rem'}}>Отпустите файл для загрузки</Box>
        </Box>
      )}
      <ChatMessagesList />
      <ImageGalleryViewer />
      <ChatMessagesForm />
    </Box>
  );
};
