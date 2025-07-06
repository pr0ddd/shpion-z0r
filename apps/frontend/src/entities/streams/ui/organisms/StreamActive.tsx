import { Box } from '@mui/material';
import { StreamCard } from '../atoms/StreamCard';
import { memo, useEffect, useRef, useState } from 'react';
import { CircularProgress } from '@ui/atoms/CircularProgress';
import { NoStreamPlaceholder } from '../atoms/NoStreamPlaceholder';

interface StreamActiveProps {
  tracks: MediaStreamTrack[];
}

export const StreamActive = memo(
  ({ tracks }: StreamActiveProps) => <StreamActiveInner tracks={tracks} />,
  (prevProps, nextProps) => {
    const concatIds = (tracks: MediaStreamTrack[]) =>
      tracks.map((t) => t.id).join('__');

    return concatIds(prevProps.tracks) === concatIds(nextProps.tracks);
  }
);

export const StreamActiveInner: React.FC<StreamActiveProps> = memo(
  ({ tracks }) => {
    const [isReady, setIsReady] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (!tracks.length) {
        return;
      }

      const stream = new MediaStream(tracks);
      videoRef.current!.srcObject = stream;
      videoRef.current!.onloadeddata = () => setIsReady(true);
      videoRef.current!.play().catch(() => {});
    }, [tracks]);

    return (
      <StreamCard grow>
        {tracks.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
              }}
              playsInline
              controls
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            {isReady ? <NoStreamPlaceholder /> : <CircularProgress />}
          </Box>
        )}
      </StreamCard>
    );
  }
);
