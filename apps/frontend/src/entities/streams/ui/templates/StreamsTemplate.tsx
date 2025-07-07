import { Box } from '@mui/material';
import { Track } from 'livekit-client';

import { StreamActive } from '../organisms/StreamActive';
import { StreamGallery } from '../organisms/StreamGallery';
import { useMemo, useState } from 'react';
import { useScreenShare } from '@entities/members/model/useScreenShare';
import { useStream } from '@entities/streams/model/useStream';
import { useSessionStore } from '@entities/session';
import { useLocalParticipantCamera } from '@entities/members/model/useLocalParticipantCamera';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';


export const StreamsTemplate: React.FC = () => {
  const user = useSessionStore(s => s.user);
  const { stopAll: stopAllScreenShare, startNew } = useScreenShare();
  const { toggleCameraEnabled, isCameraEnabled } = useLocalParticipantCamera();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { streamTracks, streamTracksWithAudio } = useStream();

  const [activeVideoTrackSid, setActiveVideoTrackSid] = useState<string | null>(
    null
  );
  const [mediaStreamTracks, setMediaStreamTracks] = useState<
    MediaStreamTrack[]
  >([]);

  /**
   * Combine screen share tracks with camera and microphone tracks
   */
  const activeTrack = useMemo(() => {
    if (streamTracks.length !== 0 && !activeVideoTrackSid) {
      // TEMP: !!!
      setActiveVideoTrackSid(streamTracks[0].publication?.track?.sid ?? null);
      return null;
    }

    const activeVideoTrack = streamTracks.find(
      (t) => t.publication.track?.sid === activeVideoTrackSid
    );
    const activeStreamName = activeVideoTrack?.publication?.trackInfo?.stream;

    const mediaStreamTracks = streamTracksWithAudio
      .filter((t) => t.publication?.trackInfo?.stream === activeStreamName)
      .map((t) => t.publication?.track?.mediaStreamTrack)
      .filter((t) => t !== undefined);

    setMediaStreamTracks(mediaStreamTracks);

    return (
      streamTracks.find(
        (t) => t.publication?.track?.sid === activeVideoTrackSid
      ) ?? null
    );
  }, [streamTracks, activeVideoTrackSid]);

  const handleStopAll = () => {
    stopAllScreenShare();

    // Unpublish all local camera video tracks to remove them from gallery immediately
    if (localParticipant) {
      localParticipant.trackPublications.forEach((pub) => {
        if (pub.source === Track.Source.Camera && pub.track) {
          room?.localParticipant.unpublishTrack(pub.track);
          pub.track.stop();
        }
      });
    }

    // Ensure camera flag off
    if (isCameraEnabled) {
      toggleCameraEnabled();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        gap: 2,
        padding: 2,
        minHeight: 0,
      }}
    >
      <StreamActive tracks={mediaStreamTracks} />
      <StreamGallery
        tracks={streamTracks}
        onSelect={(stream) =>
          setActiveVideoTrackSid(stream.publication?.track?.sid ?? null)
        }
        onStartScreenShare={() => startNew(user?.id ?? 'unknown')}
        onStartCamera={() => {
          if (!isCameraEnabled) {
            toggleCameraEnabled();
          }
        }}
        handleStopAll={handleStopAll}
      />
    </Box>
  );
};
