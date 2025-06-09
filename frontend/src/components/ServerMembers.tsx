import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, List, ListItem, ListItemText, Paper, IconButton, Tooltip, CircularProgress, useTheme, Avatar } from '@mui/material';
import {
    useParticipants,
    useRoomContext,
    useLocalParticipant,
    useIsMuted,
    useConnectionState,
    useIsSpeaking,
    useTracks,
    useDataChannel,
} from '@livekit/components-react';
import { RoomEvent, Track, Participant, ConnectionState, ParticipantEvent } from 'livekit-client';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import HeadsetIcon from '@mui/icons-material/Headset';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import NoiseAwareIcon from '@mui/icons-material/NoiseAware';
import NoiseControlOffIcon from '@mui/icons-material/NoiseControlOff';

/* eslint-disable no-bitwise */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getContrastingTextColor = (hexColor: string): string => {
    if (hexColor.startsWith('#')) {
        hexColor = hexColor.slice(1);
    }
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

// ====================================================================================
// Sub-components that DEPEND on LiveKit context (REDESIGNED)
// ====================================================================================

const ParticipantItem: React.FC<{ participant: Participant, isDeafened: boolean }> = ({ participant, isDeafened }) => {
    const theme = useTheme();
    const isMicMuted = useIsMuted({ participant, source: Track.Source.Microphone });
    const isSpeaking = useIsSpeaking(participant);
    const displayName = participant.identity.split(':')[1] || participant.identity;

    const speakingStyles = isSpeaking ? {
        color: theme.palette.text.primary,
        fontWeight: 'bold',
        textShadow: `0 0 8px ${theme.palette.success.main}`,
        transform: 'scale(1.02)'
    } : {};

    const bgColor = stringToColor(participant.identity);
    const textColor = getContrastingTextColor(bgColor);
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <ListItem sx={{ 
            py: 1,
            borderRadius: theme.shape.borderRadius,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
            ...speakingStyles
        }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: bgColor, color: textColor, fontSize: '0.9rem' }}>
                {initial}
            </Avatar>
            <ListItemText primary={displayName} primaryTypographyProps={{ sx: { transition: 'all 0.2s', fontWeight: '500' } }}/>
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', ml: 1 }}>
                {isSpeaking && <VolumeUpIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />}
                {isMicMuted ? <MicOffIcon fontSize="small" sx={{ color: theme.palette.error.main }} /> : <MicIcon fontSize="small" />}
                {isDeafened && <HeadsetOffIcon titleAccess="Пользователь отключил звук" fontSize="small" sx={{ ml: 1, color: theme.palette.error.main }} />}
            </Box>
        </ListItem>
    );
};

const VoiceUI: React.FC = () => {
    const theme = useTheme();
    const remoteParticipants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();
    const connectionState = useConnectionState(room);
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);

    const [deafenedSids, setDeafenedSids] = useState(new Set<string>());
    const [isSelfDeafened, setIsSelfDeafened] = useState(false);
    
    const onDataReceived = useCallback((msg: any) => {
        try {
            const { sid, deafened } = JSON.parse(new TextDecoder().decode(msg.payload));
            if (typeof sid === 'string' && typeof deafened === 'boolean') {
                setDeafenedSids(prevSids => {
                    const newSids = new Set(prevSids);
                    if (deafened) newSids.add(sid); else newSids.delete(sid);
                    return newSids;
                });
            }
        } catch (e) { console.error("Failed to parse data channel message", e); }
    }, []);

    const { send } = useDataChannel('deafen_status', onDataReceived);

    useEffect(() => {
        const onParticipantConnected = () => {
            if (isSelfDeafened && send && localParticipant) {
                const payload = JSON.stringify({ sid: localParticipant.sid, deafened: isSelfDeafened });
                send(new TextEncoder().encode(payload), { reliable: true });
            }
        };
        room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
        return () => { room.off(RoomEvent.ParticipantConnected, onParticipantConnected); }
    }, [room, send, isSelfDeafened, localParticipant]);

    const localScreenShare = screenShareTracks.find(track => track.participant.sid === localParticipant?.sid);
    const [isMicMuted, setIsMicMuted] = useState(true);
    const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(true);

    useEffect(() => {
        if (!localParticipant) return;
        const handleMicStateChange = () => setIsMicMuted(!localParticipant.isMicrophoneEnabled);
        handleMicStateChange();
        localParticipant.on(ParticipantEvent.TrackMuted, handleMicStateChange);
        localParticipant.on(ParticipantEvent.TrackUnmuted, handleMicStateChange);
        return () => {
            localParticipant.off(ParticipantEvent.TrackMuted, handleMicStateChange);
            localParticipant.off(ParticipantEvent.TrackUnmuted, handleMicStateChange);
        };
    }, [localParticipant]);

    if (!localParticipant) {
        return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>;
    }
    
    const handleToggleDeafen = () => {
        if (!localParticipant || !send) return;
        const newState = !isSelfDeafened;
        setIsSelfDeafened(newState);
        setDeafenedSids(prev => {
            const newSids = new Set(prev);
            if (newState) newSids.add(localParticipant.sid); else newSids.delete(localParticipant.sid);
            return newSids;
        });
        room.remoteParticipants.forEach(p => p.audioTrackPublications.forEach(pub => pub.setSubscribed(!newState)));
        send(new TextEncoder().encode(JSON.stringify({ sid: localParticipant.sid, deafened: newState })), { reliable: true });
    };

    const handleToggleMic = () => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
    const handleToggleScreenShare = () => localParticipant.setScreenShareEnabled(!localScreenShare, { audio: false });
    
    const handleToggleNoiseSuppression = async () => {
        const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPub?.track && 'restartTrack' in micPub.track) {
            const newState = !isNoiseSuppressionEnabled;
            await micPub.track.restartTrack({ noiseSuppression: newState });
            setIsNoiseSuppressionEnabled(newState);
        }
    };
    
    // Create a unique list of participants to prevent key errors
    const participantsMap = new Map<string, Participant>();
    if (localParticipant) {
        participantsMap.set(localParticipant.sid, localParticipant);
    }
    remoteParticipants.forEach((p) => {
        participantsMap.set(p.sid, p);
    });
    const allParticipants = Array.from(participantsMap.values());

    return (
        <>
            <List sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                {allParticipants.map(p => (
                    <ParticipantItem key={p.sid} participant={p} isDeafened={deafenedSids.has(p.sid)} />
                ))}
            </List>
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mx: 1,
                    mb: 1,
                    borderRadius: theme.shape.borderRadius,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(17, 18, 20, 0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)', // Safari support
                }}
            >
                <Box display="flex" justifyContent="space-around" alignItems="center">
                    <Tooltip title={isMicMuted ? "Включить микрофон" : "Выключить микрофон"}>
                        <span>
                            <IconButton onClick={handleToggleMic} disabled={connectionState !== ConnectionState.Connected}>
                                {isMicMuted ? <MicOffIcon sx={{ color: theme.palette.error.main }} /> : <MicIcon sx={{ color: theme.palette.success.main }}/>}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={isSelfDeafened ? "Включить звук" : "Выключить звук (оглушить)"}>
                        <span>
                            <IconButton onClick={handleToggleDeafen} disabled={connectionState !== ConnectionState.Connected}>
                                {isSelfDeafened ? <HeadsetOffIcon sx={{ color: theme.palette.error.main }} /> : <HeadsetIcon />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={localScreenShare ? "Отключить демонстрацию" : "Включить демонстрацию"}>
                        <span>
                            <IconButton onClick={handleToggleScreenShare} disabled={connectionState !== ConnectionState.Connected}>
                                {localScreenShare ? <StopScreenShareIcon sx={{ color: theme.palette.custom.purple }} /> : <ScreenShareIcon />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={isNoiseSuppressionEnabled ? "Отключить шумоподавление" : "Включить шумоподавление"}>
                        <span>
                            <IconButton onClick={handleToggleNoiseSuppression} disabled={connectionState !== ConnectionState.Connected}>
                                {isNoiseSuppressionEnabled ? <NoiseAwareIcon sx={{ color: theme.palette.custom.purple }} /> : <NoiseControlOffIcon />}
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>
        </>
    );
};

// ====================================================================================
// Main Wrapper Component (REDESIGNED)
// ====================================================================================

interface ServerMembersProps {
    isConnected: boolean;
}

const ServerMembers: React.FC<ServerMembersProps> = ({ isConnected }) => {
    const { user } = useAuth();
    const theme = useTheme();
    
    if (!user) return null;
    const displayName = user.username.split(':')[1] || user.username;

    return (
        <Box
            sx={{
                width: 240,
                flexShrink: 0,
                bgcolor: 'background.paper', // from theme
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                color: 'text.secondary', // from theme
                borderRight: `1px solid ${theme.palette.background.default}`
            }}
        >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.background.default}` }}>
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                    Участники
                </Typography>
            </Box>
            
            <Box flexGrow={1} display="flex" flexDirection="column" justifyContent="space-between">
                {isConnected ? (
                    <VoiceUI />
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Нет подключения к голосовому чату.
                        </Typography>
                    </Box>
                )}
                 {/* User Info Section at the bottom */}
            </Box>
        </Box>
    );
};

export default ServerMembers; 