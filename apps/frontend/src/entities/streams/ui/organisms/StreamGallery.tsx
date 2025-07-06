import { Box, Typography } from '@mui/material';
import { StreamGalleryItem } from '../molecules/StreamGalleryItem';
import { TrackReference } from '@livekit/components-react';
import { StreamControlPanel } from '../molecules/StreamControlPanel';
import { useSessionStore } from '@entities/session';
import { useScreenShare } from '@entities/members/model/useScreenShare';

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
  const { stopShare } = useScreenShare();
  const user = useSessionStore((s) => s.user);

  const handleStop = (_: TrackReference) => {
    // TODO: rework stopShare to stop by track sid
    alert('TODO: stop share by track sid');
    stopShare(0);
  };
  const handleOpenInWindow = () => {
    alert('open in window');
  };

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
            }}
          >
            Нет активных трансляций
          </Typography>
        ) : (
          tracks.map((track) => (
            <StreamGalleryItem
              key={track.publication.track?.sid}
              track={track}
              isMe={track.participant.identity === user?.id}
              onSelect={onSelect}
              onStopStream={handleStop}
              onOpenInWindow={handleOpenInWindow}
            />
          ))
        )}
      </Box>
    </Box>
  );
};
