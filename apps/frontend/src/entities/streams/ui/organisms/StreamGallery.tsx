import { Box, Typography } from '@mui/material';
import { StreamGalleryItem } from '../molecules/StreamGalleryItem';
import { TrackReference } from '@livekit/components-react';
import { StreamControlPanel } from '../molecules/StreamControlPanel';

interface StreamGalleryProps {
  tracks: TrackReference[];
  onSelect: (stream: TrackReference) => void;
  onStartScreenShare: () => void;
  onStartCamera: () => void;
  handleStopAll: () => void;
}
export const StreamGallery: React.FC<StreamGalleryProps> = ({
  tracks,
  onSelect,
  onStartScreenShare,
  onStartCamera,
  handleStopAll,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
      }}
    >
      {/* Fixed control panel on the left */}
      <StreamControlPanel
        onStartScreenShare={onStartScreenShare}
        onStartCamera={onStartCamera}
        onStopAll={handleStopAll}
      />

      {/* Scrollable gallery of streams */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          overflow: 'auto',
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari
          },
          flex: 1,
          alignItems: 'center',
          justifyContent: tracks.length === 0 ? 'center' : 'flex-start',
        }}
      >
        {tracks.length === 0 ? (
          <Typography
            variant="body1"
            sx={{
              color: 'new.mutedForeground',
              textAlign: 'center',
              paddingRight: '160px', 
            }}
          >
            Нет активных трансляций
          </Typography>
        ) : (
          tracks.map((track) => (
            <StreamGalleryItem
              key={track.publication.track?.sid}
              track={track}
              onSelect={onSelect}
            />
          ))
        )}
      </Box>
    </Box>
  );
};
