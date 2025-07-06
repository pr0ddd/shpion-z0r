import { Box } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';
import { useEffect, useRef, useState } from 'react';
import { TrackReference } from '@livekit/components-react';
import { CircularProgress } from '@ui/atoms/CircularProgress';
import { NoStreamPlaceholder } from '../atoms/NoStreamPlaceholder';

interface StreamActiveProps {
  trackRef: TrackReference | null;
  tracks: MediaStreamTrack[];
}
export const StreamActive: React.FC<StreamActiveProps> = ({ trackRef, tracks }) => {
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!trackRef) {
      setIsReady(true);
      return;
    };

    setIsReady(false);
    const track = trackRef.publication?.track;
    // console.log('track', track);
    if (!track) return;

    const stream = new MediaStream(tracks);
    // console.log('stream', stream);
    // console.log('videoRef', videoRef.current);
    videoRef.current!.srcObject = stream;
    videoRef.current!.onloadeddata = ()=> setIsReady(true);
    videoRef.current!.play().catch(() => {});
  }, [trackRef]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
      }}
    >
      <StreamCard grow>
        {trackRef ? (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            width: '100%',
          }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', backgroundColor: 'black' }}
              playsInline
              controls
            />
          </Box>
        ) : (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
          }}>
            {isReady ? (
              <NoStreamPlaceholder />
            ) : (
              <CircularProgress />
            )}
          </Box>
        )}
      </StreamCard>
    </Box>
  );
};
