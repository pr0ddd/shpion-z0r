import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useLocalParticipant } from '@livekit/components-react';
import { Track, createLocalVideoTrack } from 'livekit-client';
import { useCameraSettingsStore } from '@entities/members/model';

interface CameraPIPProps {
  visible?: boolean;
}

export const CameraPIP: React.FC<CameraPIPProps> = ({ visible = true }) => {
  const theme = useTheme();
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track fullscreen state for icon toggle
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const handler = () => {
      const fs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFs(fs);
    };
    document.addEventListener('fullscreenchange', handler);
    // Safari
    document.addEventListener('webkitfullscreenchange', handler as any);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler as any);
    };
  }, []);

  // Helper: attach current camera track to <video>
  const setVideoStream = useCallback(() => {
    if (!visible || !videoRef.current) return;
    const camPub = localParticipant?.getTrackPublication(Track.Source.Camera);
    const mediaTrack = camPub?.track?.mediaStreamTrack as MediaStreamTrack | undefined;
    if (mediaTrack) {
      const stream = new MediaStream([mediaTrack]);
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [visible, localParticipant]);

  const preferredCamera = useCameraSettingsStore((s) => s.preferredCamera);
  const setPreferredCamera = useCameraSettingsStore((s) => s.setPreferredCamera);

  /**
   * Try to pick a deviceId that matches desired facing.
   * On most mobile browsers, device labels contain words like 'front', 'user', 'back', 'rear', 'environment'.
   * Fallback: choose first (front) or second (back) camera.
   */
  const getDeviceIdForFacing = useCallback(async (facing: 'front' | 'back') => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      if (!cams.length) return undefined;
      const keywords = facing === 'front' ? ['front', 'user'] : ['back', 'rear', 'environment'];
      for (const key of keywords) {
        const found = cams.find((d) => d.label.toLowerCase().includes(key));
        if (found) return found.deviceId;
      }
      // Fallback to position in list: assumption first = front, second = back
      if (facing === 'front') return cams[0].deviceId;
      if (cams.length > 1) return cams[1].deviceId;
      return cams[0].deviceId; // only one camera
    } catch (e) {
      console.warn('[CameraPIP] Failed to enumerate devices', e);
      return undefined;
    }
  }, []);

  // --- Draggable position (left / top) ---
  const WIDTH = 260;
  const HEIGHT = 160;

  const [pos, setPos] = useState(() => ({
    left: typeof window !== 'undefined' ? window.innerWidth - WIDTH - 10 : 10,
    top: typeof window !== 'undefined' ? window.innerHeight - HEIGHT - 70 : 70,
  }));

  // Pointer offset inside the box when dragging starts
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  // Initial attach & on deps change
  useEffect(() => {
    setVideoStream();
  }, [setVideoStream]);

  // Update when LiveKit publishes/unpublishes a new camera track
  useEffect(() => {
    if (!localParticipant) return;
    const handler = () => setVideoStream();
    localParticipant.on('trackPublished', handler);
    localParticipant.on('trackUnpublished', handler);
    return () => {
      localParticipant.off('trackPublished', handler);
      localParticipant.off('trackUnpublished', handler);
    };
  }, [localParticipant, setVideoStream]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragOffset.current = {
      x: e.clientX - pos.left,
      y: e.clientY - pos.top,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [pos]);

  const onPointerMove = (e: PointerEvent) => {
    if (!dragOffset.current) return;

    const newLeft = Math.max(0, Math.min(window.innerWidth - WIDTH, e.clientX - dragOffset.current.x));
    const newTop = Math.max(0, Math.min(window.innerHeight - HEIGHT, e.clientY - dragOffset.current.y));
    setPos({ left: newLeft, top: newTop });
  };

  const onPointerUp = () => {
    dragOffset.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  if (!visible) return null;

  return (
    <Box
      ref={containerRef}
      onPointerDown={onPointerDown}
      sx={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: theme.zIndex.modal,
        width: WIDTH,
        height: HEIGHT,
        borderRadius: 2,
        overflow: 'hidden',
        border: '2px solid',
        borderColor: 'primary.main',
        backgroundColor: 'black',
        touchAction: 'none',
        cursor: 'move',
      }}
    >
      {/* Switch camera button */}
      <IconButton
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'common.white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          zIndex: 1,
        }}
        onClick={async (e) => {
          e.stopPropagation();
          if (!localParticipant) return;

          const newFacing = preferredCamera === 'front' ? 'back' : 'front';

          const deviceId = await getDeviceIdForFacing(newFacing);
          // Prefer high resolution (1080p). Browser may downgrade if unsupported.
          const baseConstraints = { resolution: { width: 1920, height: 1080 } } as const;

          const constraints = deviceId
            ? { ...baseConstraints, deviceId }
            : { ...baseConstraints, facingMode: newFacing === 'front' ? 'user' : 'environment' };

          // Try to restart existing camera track with new constraints for seamless switch
          const camPub = localParticipant.getTrackPublication(Track.Source.Camera);
          const track = camPub?.track as any;

          try {
            if (track && typeof track.restart === 'function') {
              await track.restart(constraints as any);
            } else {
              // Hard fallback: unpublish old track and publish new one
              if (track) {
                localParticipant.unpublishTrack(track);
                track.stop();
              }

              const newTrack = await createLocalVideoTrack(constraints as any);
              try {
                newTrack.mediaStreamTrack.contentHint = 'detail';
              } catch {}
              await localParticipant.publishTrack(newTrack, { source: Track.Source.Camera });
            }
            // Re-attach to new track
            setVideoStream();
          } catch (err) {
            console.warn('[CameraPIP] Failed to switch camera', err);
          }

          setPreferredCamera(newFacing);
        }}
      >
        <FlipCameraAndroidIcon fontSize="inherit" />
      </IconButton>

      {/* Fullscreen toggle button */}
      <IconButton
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'common.white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          zIndex: 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          const elem = containerRef.current;
          if (!elem) return;
          const requestFs = () => {
            if (elem.requestFullscreen) return elem.requestFullscreen();
            if ((elem as any).webkitRequestFullscreen) return (elem as any).webkitRequestFullscreen();
            if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) return (videoRef.current as any).webkitEnterFullscreen();
          };
          const exitFs = () => {
            if (document.exitFullscreen) return document.exitFullscreen();
            if ((document as any).webkitExitFullscreen) return (document as any).webkitExitFullscreen();
          };

          if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            requestFs();
          } else {
            exitFs();
          }
        }}
      >
        {isFs ? <FullscreenExitIcon fontSize="inherit" /> : <FullscreenIcon fontSize="inherit" />}
      </IconButton>
      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Box>
  );
}; 