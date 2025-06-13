import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, IconButton, Fade, Slider } from '@mui/material';
import { VideoTrack, TrackReference } from '@livekit/components-react';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { RemoteTrackPublication, VideoQuality } from 'livekit-client';

interface FullscreenPlayerProps {
  trackRef: TrackReference;
  name: string;
  onClose: () => void;
}

export const FullscreenPlayer = ({ trackRef, name, onClose }: FullscreenPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const publication = trackRef.publication;
        if (publication instanceof RemoteTrackPublication) {
            publication.setVideoQuality(VideoQuality.HIGH);
        }
        return () => {
            if (publication instanceof RemoteTrackPublication) {
                publication.setVideoQuality(VideoQuality.LOW);
            }
        };
    }, [trackRef.publication]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onVolumeChange = () => {
            setIsMuted(videoElement.muted);
            setVolume(videoElement.volume);
        };
    
        videoElement.addEventListener('play', onPlay);
        videoElement.addEventListener('pause', onPause);
        videoElement.addEventListener('volumechange', onVolumeChange);
    
        return () => {
          videoElement.removeEventListener('play', onPlay);
          videoElement.removeEventListener('pause', onPause);
          videoElement.removeEventListener('volumechange', onVolumeChange);
        };
    }, []);

    useEffect(() => {
        const container = videoRef.current?.parentElement;
        if (!container) return;

        const showControls = () => {
            setControlsVisible(true);
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(() => setControlsVisible(false), 2000);
        };
        
        showControls();
        container.addEventListener('mousemove', showControls);
        return () => {
            container.removeEventListener('mousemove', showControls);
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, []);

    const handlePlayPause = () => {
      if (videoRef.current) {
        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
      }
    };

    const handleMuteToggle = () => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
      }
    };

    const handleVolumeChange = (_: Event, newValue: number | number[]) => {
        if (videoRef.current) {
            const newVolume = newValue as number;
            videoRef.current.volume = newVolume;
            if (newVolume > 0 && videoRef.current.muted) {
              videoRef.current.muted = false;
            }
        }
    };
    
    const renderVolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeOffIcon />;
        if (volume < 0.5) return <VolumeDownIcon />;
        return <VolumeUpIcon />;
    };

    return (
        <Box sx={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
            <VideoTrack ref={videoRef} trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Fade in={controlsVisible}>
                <Box>
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
                            <IconButton size="small" color="inherit" onClick={handlePlayPause}>
                                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" color="inherit" onClick={handleMuteToggle}>
                                {renderVolumeIcon()}
                            </IconButton>
                            <Slider size="small" value={isMuted ? 0 : volume} min={0} max={1} step={0.01} onChange={handleVolumeChange} sx={{ width: 80, color: 'white', '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px black', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                            {name}
                        </Typography>
                        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
                            <FullscreenExitIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Fade>
        </Box>
    );
}; 