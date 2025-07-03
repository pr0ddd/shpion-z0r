import { Box } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';
import { TrackReference } from '@livekit/components-react';

interface StreamGalleryItemProps {
  track: TrackReference;
  onSelect: (track: TrackReference) => void;
}

export const StreamGalleryItem: React.FC<StreamGalleryItemProps> = ({
  track,
  onSelect,
}) => {
  return (
    <StreamCard>
      <Box
        component="button"
        sx={{
          height: '90px',
          width: '160px',
          backgroundColor: 'unset',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => onSelect(track)}
      >
        preview - {track.publication?.track?.sid}
      </Box>
    </StreamCard>
  );
};
