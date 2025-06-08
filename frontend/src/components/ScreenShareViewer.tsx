import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Track } from 'livekit-client';
import { useServer } from '../contexts/ServerContext';

interface ScreenShareViewProps {
  track: Track;
  participantName: string;
}

const ScreenShareView: React.FC<ScreenShareViewProps> = ({ track, participantName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && track) {
      // Прикрепляем видео трек к элементу video
      track.attach(videoRef.current);
      
      return () => {
        // Отключаем при размонтировании
        track.detach();
      };
    }
  }, [track]);

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🖥️ {participantName} делится экраном
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        📊 Адаптивное качество: Автоматическое переключение HD ↔ Full HD ↔ SD при сложных сценах
      </Typography>
      
      <Box sx={{ 
        width: '100%', 
        backgroundColor: '#000',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '80vh', // Увеличиваем максимальную высоту
            objectFit: 'contain',
            // Отключаем сглаживание для четкости
            imageRendering: 'pixelated'
          }}
        />
      </Box>
    </Paper>
  );
};

export const ScreenShareViewer: React.FC = () => {
  const { screenTracks } = useServer();

  // Если нет демонстрируемых экранов, не показываем компонент
  if (screenTracks.size === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Демонстрация экрана
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        {Array.from(screenTracks.entries()).map(([participantId, track]) => {
          // Извлекаем имя участника из identity (убираем ID части)
          const participantName = participantId.split(':')[1] || participantId;
          
          return (
            <ScreenShareView 
              key={participantId}
              track={track} 
              participantName={participantName}
            />
          );
        })}
      </Box>
    </Box>
  );
}; 