import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, Slider, Fade } from '@mui/material';
import { VideoTrack, AudioTrack, useTracks, TrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';

export type StreamPlayerMode = 'preview' | 'tab' | 'fullscreen' | 'main';

export interface StreamPlayerProps {
  /** Reference to a published track (camera or screen share). If null – show placeholder */
  trackRef: TrackReference | null;
  mode?: StreamPlayerMode;
  onClose?: () => void;
  onPopout?: () => void;
}

/**
 * Универсальный плеер одного LiveKit-трека с оверлеем управления.
 * Используется и в отдельной вкладке стрима, и внутри модального просмотра.
 */
export const StreamPlayer: React.FC<StreamPlayerProps> = ({ trackRef, mode = 'preview', onClose, onPopout }) => {
  // вычисляем имя и номер стрима
  const { name: rawName = 'Стример', identity } = trackRef?.participant ?? {} as any;
  const streamerName = rawName;
  let streamIndex: number | null = null;
  if (identity && identity.includes('#share')) {
    const idxStr = identity.split('#share').pop();
    const idxNum = parseInt(idxStr ?? '', 10);
    if (!Number.isNaN(idxNum)) streamIndex = idxNum + 1;
  }

  // --------------------------------------------
  // Controls state (shared)
  // --------------------------------------------
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const volumeRef = useRef(1);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    document.querySelectorAll('audio').forEach((el) => {
      const media = el as HTMLMediaElement;
      media.muted = newMuted;
      if (!newMuted && volumeRef.current !== undefined) {
        media.volume = volumeRef.current;
      }
    });
  }, [isMuted]);

  // --------------------------------------------
  // Remote screen-share audio track (if any)
  // --------------------------------------------
  const screenAudioTracks = useTracks([Track.Source.ScreenShareAudio]);
  const audioTrackRef = useMemo(() => {
    if (screenAudioTracks.length === 0) return undefined;
    if (trackRef) {
      const match = screenAudioTracks.find((t) => t.participant.sid === trackRef.participant?.sid);
      if (match) return match;
    }
    // fallback to first available
    return screenAudioTracks[0];
  }, [screenAudioTracks, trackRef]);

  // --------------------------------------------
  // Picture-in-Picture state tracking
  // --------------------------------------------
  const [isPip, setIsPip] = useState(false);

  useEffect(() => {
    const onPipChange = () => setIsPip(Boolean(document.pictureInPictureElement));
    document.addEventListener('enterpictureinpicture', onPipChange);
    document.addEventListener('leavepictureinpicture', onPipChange);
    return () => {
      document.removeEventListener('enterpictureinpicture', onPipChange);
      document.removeEventListener('leavepictureinpicture', onPipChange);
    };
  }, []);

  // --------------------------------------------
  // Fullscreen-specific media controls
  // --------------------------------------------
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFs, setFs] = useState(false);
  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement && wrapperRef.current) {
      wrapperRef.current.requestFullscreen().then(() => setFs(true));
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setFs(false));
    }
  }, []);

  // keep isFs in sync with actual fullscreen state (handles PIP exit etc.)
  useEffect(() => {
    const handler = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (mode !== 'fullscreen' && mode !== 'tab') return;
    const videoEl = wrapperRef.current?.querySelector('video') as HTMLVideoElement | null;
    if (!videoEl) return;
    const onVolume = () => {
      setIsMuted(videoEl.muted);
      setVolume(videoEl.volume);
    };
    videoEl.addEventListener('volumechange', onVolume);
    return () => {
      videoEl.removeEventListener('volumechange', onVolume);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'fullscreen' && mode !== 'tab') return;
    const container = wrapperRef.current;
    if (!container) return;
    const show = () => {
      setControlsVisible(true);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setControlsVisible(false), 2000);
    };
    show();
    container.addEventListener('mousemove', show);
    return () => {
      container.removeEventListener('mousemove', show);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [mode]);

  const [sliderVisible, setSliderVisible] = useState(false);

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {trackRef ? (
        <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <Typography sx={{ color: 'white' }}>Стрим недоступен</Typography>
      )}

      {/* play screenshare audio track only in fullscreen or PiP */}
      {audioTrackRef && (isFs || mode === 'fullscreen' || isPip) && (
        <AudioTrack trackRef={audioTrackRef} volume={isMuted ? 0 : volume} />
      )}

      {/* Overlay: fullscreen controls used for fullscreen & tab modes */}
      {(mode === 'fullscreen' || isFs || mode === 'tab') && (
        <Fade in={controlsVisible}>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box onMouseEnter={()=>setSliderVisible(true)} onMouseLeave={()=>setSliderVisible(false)} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <IconButton size="small" onClick={toggleMute} sx={{ color:'white' }}>
                  {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </IconButton>
                <Slider
                  size="small"
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(_, val)=>{
                    const vol=val as number;
                    setVolume(vol);
                    setIsMuted(vol===0);
                    document.querySelectorAll('audio').forEach(el=>{
                      const m=el as HTMLMediaElement; m.volume=vol; if(vol>0) m.muted=false; else m.muted=true;
                    });
                  }}
                  sx={{ width: sliderVisible ? 100 : 0, overflow:'hidden', transition:'width .2s', color:'white', '& .MuiSlider-thumb':{width:10,height:10} }}
                />
              </Box>
            </Box>

            {/* Center label */}
            <Typography variant="subtitle1" sx={{ flexGrow: 1, textAlign: 'center', color: 'white', fontWeight: 500, px:2, pointerEvents:'none', userSelect:'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {streamerName}
              {typeof streamIndex === 'number' && ` • стрим ${streamIndex}`}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml:1 }}>
                <IconButton size="small" onClick={async () => {
                  if (document.fullscreenElement) await document.exitFullscreen();
                  const v = wrapperRef.current?.querySelector('video') as any;
                  if (v?.requestPictureInPicture) {
                    try {
                      await v.requestPictureInPicture();
                      setIsPip(true);
                    } catch (e) {
                      console.error(e);
                    }
                  }
                }} sx={{ color: 'white' }}>
                  <PictureInPictureAltIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={toggleFs} sx={{ color: 'white' }}>
                  {isFs ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      {mode === 'main' && !isFs && (
        <>
          <Box sx={{ position: 'absolute', top: 8, left: 8, px: 1.5, py: 0.5, backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1 }}>
              {streamerName} {typeof streamIndex === 'number' && `• стрим ${streamIndex}`}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 1 }}>
            {onPopout && (
              <IconButton onClick={onPopout} sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton onClick={toggleFs} sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              {isFs ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}; 