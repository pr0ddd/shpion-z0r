import { Box } from '@mui/material';
import { StreamGalleryItem } from '../molecules/StreamGalleryItem';
import { TrackReference } from '@livekit/components-react';
import { StreamStartCard } from '../molecules/StreamStartCard';

interface StreamGalleryProps {
  tracks: TrackReference[];
  onSelect: (stream: TrackReference) => void;
  onStart: () => void;
  handleStopAll: () => void;
}
export const StreamGallery: React.FC<StreamGalleryProps> = ({
  tracks,
  onSelect,
  onStart,
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
      {tracks.map((track) => (
        <StreamGalleryItem
          key={track.publication.track?.sid}
          track={track}
          onSelect={onSelect}
        />
      ))}

      <StreamStartCard onClick={onStart} />
    </Box>
  );
};
