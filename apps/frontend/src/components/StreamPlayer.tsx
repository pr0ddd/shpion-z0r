import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TrackReference, useTracks, useRoomContext } from '@livekit/components-react';
import { Track, RoomEvent, TrackPublication } from 'livekit-client';
import { isRemotePublication } from '@shared/hooks/lib/livekitUtils';

export interface StreamPlayerProps {
  trackRef: TrackReference | null;
  // legacy props – ignored in simplified player
  mode?: any;
  onClose?: () => void;
  onPopout?: () => void;
}

/**
 * Extremely simple stream player: plain <video> element with native controls.
 * No custom overlays, no audio magic – relies on browser defaults.
 */
export const StreamPlayer: React.FC<StreamPlayerProps> = ({ trackRef, mode }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  // текущий Room
  const room = useRoomContext();
  // ищем аудиотрек той же публикации (ScreenShareAudio)
  const audioTracks = useTracks([Track.Source.ScreenShareAudio]);
  const audioRef = audioTracks.find(
    (t) =>
      trackRef &&
      t.participant?.sid === trackRef.participant?.sid &&
      t.publication?.source === Track.Source.ScreenShareAudio,
  );

  // Когда меняется видеотрек или аудио-трек, формируем общий MediaStream
  const deps = [trackRef?.publication?.trackSid, audioRef?.publication?.trackSid, mode] as const;
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // holder for cleanup fn
    let detach: (()=>void) | null = null;

    // Сброс предыдущего srcObject
    videoEl.srcObject = null;

    if (!trackRef) return;

    const pub: TrackPublication = trackRef.publication as TrackPublication;
    if (isRemotePublication(pub)) {
      const attempt = () => {
        try { pub.setSubscribed(true); } catch {}
      };

      // если participant уже зарегистрирован — подписываемся сразу
      if ((room as any)?.getRemoteParticipantBySid?.(trackRef.participant?.sid)) {
        attempt();
      } else if (room && room.on) {
        // иначе ждём события подключения
        const onJoin = (p:any) => {
          if(p.sid===trackRef.participant?.sid){
            attempt();
          }
        };
        room.on(RoomEvent.ParticipantConnected, onJoin);

        detach = () => room.off(RoomEvent.ParticipantConnected, onJoin);
      } else {
        // fallback: вызываем при следующем рендере через microtask
        Promise.resolve().then(attempt);
      }
    }

    const vTrack = (pub as any)?.track;
    const aTrack = audioRef?.publication?.track;

    if (!vTrack) return;

    try {
      const tracks: MediaStreamTrack[] = [];
      if (vTrack.mediaStreamTrack) tracks.push(vTrack.mediaStreamTrack);
      if (aTrack?.mediaStreamTrack) tracks.push(aTrack.mediaStreamTrack);

      // Если аудио найдено – отдаём один общий MediaStream, чтобы controls показали громкость
      const stream = new MediaStream(tracks);
      videoEl.srcObject = stream;

      videoEl.controls = true;
      videoEl.muted = mode === 'tab';
      videoEl.style.objectFit = 'contain';
      videoEl.onloadeddata = ()=> setReady(true);
      videoEl.play().catch(() => {});
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to attach combined media stream:', e);
    }

    return () => {
      videoEl.pause();
      videoEl.srcObject = null;
      if (detach) detach();
    };
  }, deps);

  return (
    <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', position:'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {trackRef && <video ref={videoRef} style={{ width: '100%', height: '100%' }} playsInline />}
      {(!ready || !trackRef) && (
        <Box sx={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', bgcolor:'rgba(0,0,0,0.4)' }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}; 