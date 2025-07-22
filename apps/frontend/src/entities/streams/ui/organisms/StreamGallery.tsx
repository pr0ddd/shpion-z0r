import { Box, Typography } from '@mui/material';
import { StreamGalleryItem } from '../molecules/StreamGalleryItem';
import { TrackReference } from '@livekit/components-react';
import { StreamControlPanel } from '../molecules/StreamControlPanel';
import { useSessionStore } from '@entities/session';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface StreamGalleryProps {
  tracks: TrackReference[];
  onSelect: (stream: TrackReference) => void;
  onStartScreenShare: () => void;
  onStartCamera: () => void;
  handleStopAll: () => void;
  /** SID of currently active (selected) video track */
  activeSid: string | null;
}
export const StreamGallery: React.FC<StreamGalleryProps> = ({
  tracks,
  onSelect,
  onStartScreenShare,
  onStartCamera,
  handleStopAll,
  activeSid,
}) => {
  const { stopShare, stopShareByTrackSid } = useScreenShare();
  const user = useSessionStore((s) => s.user);
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const handleStop = (trackRef: TrackReference) => {
    const sid = trackRef.publication?.track?.sid;
    if (!sid) return;

    if (trackRef.source === Track.Source.ScreenShare) {
      stopShareByTrackSid(sid);
      return;
    }

    if (
      trackRef.source === Track.Source.Camera &&
      trackRef.participant.identity === localParticipant?.identity &&
      trackRef.publication?.track
    ) {
      const track = trackRef.publication.track as any;
      room?.localParticipant.unpublishTrack(track);
      track.stop();
    }
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
              isActive={track.publication.track?.sid === activeSid}
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
