import React from 'react';
import { Track } from 'livekit-client';
import {
  ParticipantTile,
  TrackLoop,
  TrackReference,
} from '@livekit/components-react';
import { Box, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const ScreenShareGrid = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  gridAutoRows: 'min-content',
  overflowY: 'auto',
  padding: theme.spacing(2),
  gap: theme.spacing(2),
  '& .lk-participant-tile': {
    borderRadius: theme.shape.borderRadius,
  }
}));

const TileWrapper = styled(Box)(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.background.paper}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    aspectRatio: '16 / 9',
}));

interface ScreenShareDisplayProps {
    tracks: TrackReference[];
}

const ScreenShareDisplay: React.FC<ScreenShareDisplayProps> = ({ tracks }) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
        height: '100%', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
    }}>
       <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.background.paper}` }}>
            <Typography variant="h6" color="text.primary">
                Демонстрация экрана
            </Typography>
        </Box>
        <ScreenShareGrid>
            <TrackLoop tracks={tracks}>
                <TileWrapper>
                    <ParticipantTile />
                </TileWrapper>
            </TrackLoop>
        </ScreenShareGrid>
    </Box>
  );
};

export default ScreenShareDisplay; 