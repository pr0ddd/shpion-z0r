import { Box } from '@mui/material';
import { OpenInNew, DesktopAccessDisabled } from '@mui/icons-material';
import { StreamCard } from '../atoms/StreamCard';
import { TrackReference } from '@livekit/components-react';
import { IconButton } from '@ui/atoms/IconButton';
import { Chip } from '@ui/atoms/Chip';
import CastIcon from '@mui/icons-material/Cast';
import { useEffect, useRef, useCallback } from 'react';
import { PREVIEW_CAPTURE_INTERVAL } from '@configs';

interface StreamGalleryItemProps {
  track: TrackReference;
  isMe: boolean;
  /** Whether this stream item is currently selected */
  isActive: boolean;
  onSelect: (track: TrackReference) => void;
  onStopStream: (track: TrackReference) => void;
  onOpenInWindow: (track: TrackReference) => void;
}

export const StreamGalleryItem: React.FC<StreamGalleryItemProps> = ({
  track,
  isMe,
  isActive,
  onSelect,
  onStopStream,
  onOpenInWindow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capturePreviewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If this stream is active, skip capturing preview
    if (isActive) {
      // Clear any existing interval if became active
      if (capturePreviewIntervalRef.current) {
        clearInterval(capturePreviewIntervalRef.current);
        capturePreviewIntervalRef.current = null;
      }
      return;
    }

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
  }, [canvasRef, isActive]);

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
          // Hide action buttons until hover
          '& .stream-action-btn': {
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity .2s',
          },
          '&:hover .stream-action-btn': {
            opacity: 1,
            pointerEvents: 'auto',
          },
        }}
        onClick={() => onSelect(track)}
      >
        {/* Preview canvas or active placeholder */}
        {isActive ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'new.mutedForeground',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
            }}
          >
            watching now
          </Box>
        ) : (
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
        )}

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
              <CastIcon fontSize="small" color="primary" />
            ) : (
              <Chip label={track.participant.name ?? 'unknown'} />
            )}
            <IconButton
              className="stream-action-btn"
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
              className="stream-action-btn"
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
