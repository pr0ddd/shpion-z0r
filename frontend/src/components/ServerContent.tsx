import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, IconButton, Fade, Slider, Dialog } from '@mui/material';
import { useTracks, VideoTrack, TrackRefContext, TrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomChat } from './CustomChat';
import { useServer } from '../contexts/ServerContext';
import { Server } from '../types';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import type { RemoteVideoTrack } from 'livekit-client';

const streamsSidebarVariants = {
  hidden: { x: '100%', width: 0 },
  visible: { x: 0, width: '300px', transition: { x: { duration: 0.3, ease: 'easeInOut' } } },
  exit: { x: '100%', width: 0, transition: { x: { duration: 0.3, ease: 'easeInOut' } } }
};

const FullscreenPlayer = ({ trackRef, name, onClose }: { trackRef: TrackReference, name: string, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const videoElement = document.querySelector('.fullscreen-video-container video');
        if (videoElement) {
            videoRef.current = videoElement as HTMLVideoElement;

            const video = videoRef.current;
            setIsPlaying(!video.paused);
            setIsMuted(video.muted);
            setVolume(video.volume);

            const onPlay = () => setIsPlaying(true);
            const onPause = () => setIsPlaying(false);
            const onVolumeChange = () => { if (video) { setIsMuted(video.muted); setVolume(video.volume); } };
        
            video.addEventListener('play', onPlay);
            video.addEventListener('pause', onPause);
            video.addEventListener('volumechange', onVolumeChange);
        
            return () => {
              video.removeEventListener('play', onPlay);
              video.removeEventListener('pause', onPause);
              video.removeEventListener('volumechange', onVolumeChange);
            };
        }
    }, []);

    useEffect(() => {
        const showControls = () => {
            setControlsVisible(true);
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(() => setControlsVisible(false), 2000);
        };
        const container = document.querySelector('.fullscreen-video-container');
        if (container) {
            showControls();
            container.addEventListener('mousemove', showControls);
            return () => {
                container.removeEventListener('mousemove', showControls);
                if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            };
        }
    }, []);

    const handlePlayPause = () => { if (videoRef.current) { videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); }};
    const handleMuteToggle = () => { if (videoRef.current) { videoRef.current.muted = !videoRef.current.muted; } };
    const handleVolumeChange = (_: Event, newValue: number | number[]) => {
        if (videoRef.current) {
            const newVolume = newValue as number;
            videoRef.current.volume = newVolume;
            if (newVolume > 0 && videoRef.current.muted) videoRef.current.muted = false;
        }
    };
    const VolumeIcon = () => { if (isMuted || volume === 0) return <VolumeOffIcon />; if (volume < 0.5) return <VolumeDownIcon />; return <VolumeUpIcon />; };

    return (
        <Box className="fullscreen-video-container" sx={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
            <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Fade in={controlsVisible}>
                <Box>
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
                            <IconButton size="small" color="inherit" onClick={handlePlayPause}> {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />} </IconButton>
                            <IconButton size="small" color="inherit" onClick={handleMuteToggle}> <VolumeIcon /> </IconButton>
                            <Slider size="small" value={isMuted ? 0 : volume} min={0} max={1} step={0.01} onChange={handleVolumeChange} sx={{ width: 80, color: 'white', '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px black', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}> {name} </Typography>
                        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}> <FullscreenExitIcon /> </IconButton>
                    </Box>
                </Box>
            </Fade>
        </Box>
    );
};

const StreamPreview: React.FC<{ trackRef: TrackReference, members: Server['members'] }> = ({ trackRef, members }) => {
    const participantId = trackRef.participant.identity;
    const member = members.find(m => m.userId === participantId);
    const name = member ? member.user.username : participantId;
    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    return (
        <>
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: '#000', lineHeight: 0 }}>
                <VideoTrack trackRef={trackRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                <Fade in={true}>
                    <Box>
                        <Box sx={{ position: 'absolute', top: '8px', left: '8px', px: 1.5, py: 0.5, backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}> {name} </Typography>
                        </Box>
                        <IconButton onClick={() => setFullscreenOpen(true)} sx={{ position: 'absolute', bottom: '8px', right: '8px', color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}>
                            <FullscreenIcon />
                        </IconButton>
                    </Box>
                </Fade>
            </Box>
            <Dialog 
                fullScreen 
                open={fullscreenOpen} 
                onClose={() => setFullscreenOpen(false)} 
                PaperProps={{ 
                    sx: { 
                        backgroundColor: 'black',
                        overflow: 'hidden'
                    } 
                }}
            >
                <FullscreenPlayer trackRef={trackRef} name={name} onClose={() => setFullscreenOpen(false)} />
            </Dialog>
        </>
    );
};

const ServerContent = () => {
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const { selectedServer: server } = useServer();

    if (!server) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
            <Box sx={{ flexGrow: 1, minHeight: 0, background: '#36393f' }}>
                <CustomChat />
            </Box>

            <AnimatePresence>
                {screenShareTracks.length > 0 && (
                    <motion.div
                        variants={streamsSidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            flexShrink: 0,
                            overflow: 'hidden',
                            background: '#2f3136',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.12)'
                        }}
                    >
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflowY: 'auto' }}>
                            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Стримы</Typography>
                            {screenShareTracks.map(trackRef => (
                                <TrackRefContext.Provider value={trackRef} key={trackRef.publication.trackSid}>
                                    <StreamPreview trackRef={trackRef} members={server.members} />
                                </TrackRefContext.Provider>
                            ))}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default ServerContent;