import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Box,
  Fade,
  IconButton,
  Slider,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  AudioTrack,
  TrackReference,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';
import { useFullscreen } from '../hooks/useFullscreen';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import { useInactivityHide } from '../hooks/useInactivityHide';

export type StreamPlayerMode = 'preview' | 'tab' | 'fullscreen' | 'main';

export interface StreamPlayerProps {
  /** Published track (camera or screen share). */
  trackRef: TrackReference | null;
  /** Visual/display mode – affects UI and audio policy. */
  mode?: StreamPlayerMode;
  /** Fired in "tab" or "fullscreen" modes when user closes the player. */
  onClose?: () => void;
  /** Pop-out button handler (only in "main" mode). */
  onPopout?: () => void;
}

export interface StreamPlayerHandle {
  /** жёстко выключить звук (mute + disable track) */
  muteHard(): void;
}

/**
 * Единый плеер LiveKit-трека с управлением громкостью, полноэкранным режимом
 * и PiP. Обеспечивает строгую политику звука: превью никогда не воспроизводит
 * аудио, даже если пользователь ранее включал звук в полноэкранном режиме.
 */
export const StreamPlayer = forwardRef<StreamPlayerHandle, StreamPlayerProps>(
  ({ trackRef, mode = 'preview', onClose, onPopout }, ref) => {
    /* ------------------------------------------------------------------
     * Generic info (имя стримера, индекс экрана)
     * ---------------------------------------------------------------- */
    const { name: rawName = 'Стример', identity } =
      (trackRef?.participant as any) ?? {};
    const streamerName = rawName;
    let streamIndex: number | null = null;
    if (identity && identity.includes('#share')) {
      const idx = Number(identity.split('#share').pop());
      streamIndex = Number.isNaN(idx) ? null : idx + 1;
    }

    /* ------------------------------------------------------------------
     * Local UI state
     * ---------------------------------------------------------------- */
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [sliderVisible, setSliderVisible] = useState(false);

    const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

    /* ------------------------------------------------------------------
     * Fullscreen / PiP helpers
     * ---------------------------------------------------------------- */
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { isFs, toggle: toggleFs } = useFullscreen(wrapperRef);
    const isPip = usePictureInPicture();
    const controlsVisible = useInactivityHide(wrapperRef, 2000);

    /* ------------------------------------------------------------------
     * Audio policy – «preview never sounds»
     * ---------------------------------------------------------------- */
    const screenAudioTracks = useTracks([Track.Source.ScreenShareAudio]);

    const isAudioAllowed = useMemo(() => {
      // Звук разрешён только в полноэкранных режимах (fullscreen, tab) либо
      // когда компонент фактически находится в Fullscreen API (isFs) или PiP.
      // Во всех остальных случаях, включая "main"/"preview" плитки, звук запрещён.
      return (
        mode === 'fullscreen' ||
        mode === 'tab' ||
        isFs ||
        isPip
      );
    }, [mode, isFs, isPip]);

    const audioTrackRef = useMemo<TrackReference | undefined>(() => {
      if (!isAudioAllowed || screenAudioTracks.length === 0) return undefined;

      // По возможности берём аудио-трек того же участника.
      if (trackRef) {
        const match = screenAudioTracks.find(
          (t) => t.participant.sid === trackRef.participant?.sid,
        );
        if (match) return match;
      }

      // Падение назад: первый доступный аудиотрек.
      return screenAudioTracks[0];
    }, [isAudioAllowed, screenAudioTracks, trackRef]);

    const audioPublications = useMemo(() => {
      if (!trackRef) return [] as any[];
      const participant = trackRef.participant as any;
      let pubsArr: any[] = [];
      const tp = participant?.trackPublications;
      if (tp) {
        if (typeof tp.values === 'function') {
          pubsArr = Array.from(tp.values()); // Map
        } else if (Array.isArray(tp)) {
          pubsArr = tp;
        }
      }
      const audios = pubsArr.filter((p:any)=> p.source === Track.Source.ScreenShareAudio);
      console.log('[StreamPlayer] audioPublications count', audios.length);
      return audios;
    }, [trackRef]);

    // включаем/выключаем получение аудио прямо на уровне подписки
    useEffect(()=>{
      audioPublications.forEach((pub:any)=>{
        if (typeof pub.setEnabled === 'function') {
          pub.setEnabled(isAudioAllowed);
        }
      });
    }, [audioPublications, isAudioAllowed]);

    /* ------------------------------------------------------------------
     * Синхронизируем состояние mute/volume с элементом <audio>
     * ---------------------------------------------------------------- */
    useEffect(() => {
      const audioEl = wrapperRef.current?.querySelector('audio') as
        | HTMLAudioElement
        | undefined;
      if (!audioEl) return;

      const handleChange = () => {
        setIsMuted(audioEl.muted || audioEl.volume === 0);
        setVolume(audioEl.volume);
      };

      audioEl.addEventListener('volumechange', handleChange);
      return () => audioEl.removeEventListener('volumechange', handleChange);
    }, [audioTrackRef]);

    // ▼ ensure video element itself is muted when audio is not allowed (e.g., preview tiles)
    useEffect(() => {
      const mediaEls = wrapperRef.current?.querySelectorAll('video, audio') as NodeListOf<HTMLMediaElement> | null;
      if (!mediaEls) return;

      mediaEls.forEach((el) => {
        console.log('[StreamPlayer] apply mute to media', isAudioAllowed);
        if (isAudioAllowed) {
          el.muted = isMuted;
          (el as any).volume = isMuted ? 0 : volume;
        } else {
          const media = el as HTMLMediaElement;
          media.muted = true;
          media.volume = 0;
        }
      });
    }, [isAudioAllowed, isMuted, volume]);

    /* ------------------------------------------------------------------
     * Audio policy – «preview never sounds»
     * ---------------------------------------------------------------- */
    // helper: полностью выключить звук
    const muteHard = useCallback(() => {
      try {
        audioPublications.forEach((pub:any)=>{
          if (typeof pub.setEnabled === 'function') {
            console.log('[StreamPlayer] muteHard: disable publication', pub.trackSid);
            pub.setEnabled(false);
            // детачим элементы 
            if (pub.track && typeof pub.track.detach === 'function') {
              pub.track.detach().forEach((el:HTMLElement)=> el.remove());
            }
          }
        });
      } catch (err) {
        console.warn('[StreamPlayer] muteHard setEnabled error', err);
      }

      // 2) локально замьютить все элементы
      wrapperRef.current
        ?.querySelectorAll('video,audio')
        .forEach((el) => {
          const media = el as HTMLMediaElement;
          media.muted = true;
          media.volume = 0;
        });

      setIsMuted(true);
      setVolume(0);
    }, [audioPublications]);

    useImperativeHandle(ref, () => ({ muteHard }), [muteHard]);

    /* ------------------------------------------------------------------
     * Dispatch global event о том, что плеер вошёл/вышел из Fullscreen
     * ---------------------------------------------------------------- */
    useEffect(() => {
      if (!trackRef?.publication?.trackSid) return;
      const detail = {
        trackSid: (trackRef.publication as any).trackSid,
        isFs,
      } as const;
      console.log('[StreamPlayer] dispatch fs-change', detail);
      document.dispatchEvent(
        new CustomEvent('stream-fs-change', { detail }),
      );
    }, [isFs, trackRef]);

    /* ------------------------------------------------------------------
     * Render helpers
     * ---------------------------------------------------------------- */
    const renderControlsBar = () => (
      <Fade in={controlsVisible}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* --- Left: Volume --- */}
          <Box
            onMouseEnter={() => setSliderVisible(true)}
            onMouseLeave={() => setSliderVisible(false)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <IconButton size="small" sx={{ color: 'white' }} onClick={toggleMute}>
              {isMuted ? (
                <VolumeOffIcon fontSize="small" />
              ) : (
                <VolumeUpIcon fontSize="small" />
              )}
            </IconButton>
            <Slider
              size="small"
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(_, v) => {
                const vol = v as number;
                setVolume(vol);
                setIsMuted(vol === 0);
              }}
              sx={{
                width: sliderVisible ? 100 : 0,
                overflow: 'hidden',
                transition: 'width .2s',
                color: 'white',
                '& .MuiSlider-thumb': { width: 10, height: 10 },
              }}
            />
          </Box>

          {/* --- Center: Label --- */}
          <Typography
            variant="subtitle1"
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              color: 'white',
              fontWeight: 500,
              px: 2,
              userSelect: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
            }}
          >
            {streamerName}
            {typeof streamIndex === 'number' && ` • стрим ${streamIndex}`}
          </Typography>

          {/* --- Right: Actions --- */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={async () => {
                if (document.fullscreenElement) await document.exitFullscreen();
                const video = wrapperRef.current?.querySelector('video') as
                  | HTMLVideoElement
                  | undefined;
                if (video?.requestPictureInPicture) {
                  try {
                    await video.requestPictureInPicture();
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}
            >
              <PictureInPictureAltIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: 'white' }} onClick={toggleFs}>
              {isFs ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
      </Fade>
    );

    /* ------------------------------------------------------------------
     * Main render
     * ---------------------------------------------------------------- */
    const shouldShowControls = mode === 'fullscreen' || isFs || mode === 'tab';

    return (
      <Box
        ref={wrapperRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          bgcolor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {trackRef ? (
          <VideoTrack
            trackRef={trackRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit:
                isFs || mode === 'fullscreen' || mode === 'tab' ? 'cover' : 'contain',
            }}
          />
        ) : (
          <CircularProgress color="inherit" />
        )}

        {/* Audio (if allowed) */}
        {audioTrackRef && isAudioAllowed && (
          <AudioTrack trackRef={audioTrackRef} volume={isMuted ? 0 : volume} />
        )}

        {/* Overlay controls for fullscreen & tab */}
        {shouldShowControls && renderControlsBar()}

        {/* In "main" (grid) mode – title & actions in corners */}
        {mode === 'main' && !isFs && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1 }}
              >
                {streamerName}{' '}
                {typeof streamIndex === 'number' && `• стрим ${streamIndex}`}
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                display: 'flex',
                gap: 1,
              }}
            >
              {onPopout && (
                <IconButton
                  onClick={onPopout}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                onClick={toggleFs}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                {isFs ? (
                  <FullscreenExitIcon fontSize="small" />
                ) : (
                  <FullscreenIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    );
  }
); 