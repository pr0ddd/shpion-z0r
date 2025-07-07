import { Box } from '@mui/material';
import { OpenInNew, DesktopAccessDisabled } from '@mui/icons-material';
import { StreamCard } from '../atoms/StreamCard';
import { TrackReference } from '@livekit/components-react';
import { IconButton } from '@ui/atoms/IconButton';
import { Chip } from '@ui/atoms/Chip';
import { useEffect, useRef, useCallback } from 'react';
import { PREVIEW_CAPTURE_INTERVAL } from '@configs';

interface StreamGalleryItemProps {
  track: TrackReference;
  isMe: boolean;
  onSelect: (track: TrackReference) => void;
  onStopStream: (track: TrackReference) => void;
  onOpenInWindow: (track: TrackReference) => void;
}

export const StreamGalleryItem: React.FC<StreamGalleryItemProps> = ({
  track,
  isMe,
  onSelect,
  onStopStream,
  onOpenInWindow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capturePreviewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    capturePreview();
    capturePreviewIntervalRef.current = setInterval(
      capturePreview,
      PREVIEW_CAPTURE_INTERVAL
    );

    return () => {
      if (capturePreviewIntervalRef.current) {
        clearInterval(capturePreviewIntervalRef.current);
      }
    };
  }, [canvasRef]);

  const capturePreview = useCallback(async () => {
    const mediaTrack = track.publication?.track?.mediaStreamTrack;
    if (!mediaTrack || !canvasRef.current) return;
    if (mediaTrack.readyState !== 'live') return;
    // @ts-ignore - ImageCapture may be missing in TypeScript libs
    const ic = new ImageCapture(mediaTrack);
    const bitmap = await ic.grabFrame();

    const canvas = canvasRef.current;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
  }, [track]);

  return (
    <StreamCard>
      <Box
        sx={{
          height: '110px',
          width: '190px',
          position: 'relative',
        }}
        onClick={() => onSelect(track)}
      >
        {/* Preview canvas */}
        <Box
          component="canvas"
          ref={canvasRef}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Select button */}
        <Box
          component="button"
          sx={{
            position: 'absolute',
            inset: 0,
            padding: 0,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
          }}
          onClick={() => onSelect(track)}
        />

        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            {isMe ? (
              <Chip label="you" color="primary" />
            ) : (
              <Chip label={track.participant.name ?? 'unknown'} />
            )}
            <IconButton
              icon={<DesktopAccessDisabled />}
              size="small"
              color="error"
              onClick={() => onStopStream(track)}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
          >
            <IconButton
              icon={<OpenInNew />}
              size="small"
              color="default"
              onClick={() => onOpenInWindow(track)}
            />
          </Box>
        </Box>
      </Box>
    </StreamCard>
  );
};
