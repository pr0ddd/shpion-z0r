import React from 'react';
import { Box, Typography, Avatar, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionState, Room, Track, VideoPresets, createLocalVideoTrack, createLocalScreenTracks, LocalTrack } from 'livekit-client';
import { useConnectionState, useMaybeRoomContext, useTrackMutedIndicator, useTracks } from '@livekit/components-react';
import { useNotification } from '../contexts/NotificationContext';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

const ActualVoiceControls: React.FC<{ room: Room }> = ({ room }) => {
    const connectionState = useConnectionState(room);
    // We can safely assume localParticipant exists because we are connected.
    const { isMuted } = useTrackMutedIndicator({ source: Track.Source.Microphone, participant: room.localParticipant });

    const tracks = useTracks([Track.Source.Camera]);
    
    const isCameraOn = tracks.some(
        (track) => track.participant.isLocal && track.source === Track.Source.Camera
    );

    if (connectionState !== ConnectionState.Connected) {
        return null;
    }

    const onMuteClick = () => {
        room.localParticipant.setMicrophoneEnabled(!isMuted);
    };

    const onCameraClick = () => {
        room.localParticipant.setCameraEnabled(!isCameraOn);
    };

    const onDisconnectClick = () => {
        room.disconnect();
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                <IconButton onClick={onMuteClick}>
                    {isMuted ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}>
                <IconButton onClick={onCameraClick}>
                    {isCameraOn ? <VideocamOffIcon /> : <VideocamIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title="Disconnect">
                <IconButton onClick={onDisconnectClick} sx={{ color: 'error.main' }}>
                    <CallEndIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

const VoiceControls: React.FC = () => {
    const room = useMaybeRoomContext();

    if (!room) {
        return null;
    }
    return <ActualVoiceControls room={room} />;
}

const UserPanel: React.FC = () => {
    const { user } = useAuth();
    const room = useMaybeRoomContext();
    const { showNotification } = useNotification();

    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const isScreenSharing = screenShareTracks.some(
        (track) => track.participant.isLocal
    );

    const onScreenShareClick = async () => {
        if (!room) {
            // Можно будет вернуть уведомления позже, если захотите
            console.error("Room is not available for screen sharing.");
            return;
        }

        if (isScreenSharing) {
            const screenTrackRef = screenShareTracks.find(
                (trackRef) => trackRef.participant.isLocal
            );
            const trackToUnpublish = screenTrackRef?.publication?.track;
            if (trackToUnpublish && trackToUnpublish instanceof LocalTrack) {
                room.localParticipant.unpublishTrack(trackToUnpublish);
            }
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            const screenTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            await room.localParticipant.publishTrack(screenTrack, {
                source: Track.Source.ScreenShare,
                name: 'screen',
            });
            
            // Публикуем аудиодорожку, если она есть
            if (audioTrack) {
                await room.localParticipant.publishTrack(audioTrack, {
                    source: Track.Source.ScreenShareAudio,
                    name: 'screen-audio',
                });
            }
        } catch (e) {
            console.error('Could not start screen share:', e);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <Paper 
            elevation={2} 
            sx={{
                p: 1.5,
                mt: 'auto', 
                flexShrink: 0, 
                backgroundColor: 'background.default',
                borderTop: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar src={user.avatar || undefined} sx={{ width: 32, height: 32, mr: 1.5 }}/>
                <Typography variant="body1" fontWeight="bold" noWrap>
                    {user.username}
                </Typography>
            </Box>
            
            <Divider />

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-around' }}>
                <Tooltip title={isScreenSharing ? "Stop Sharing" : "Share Screen"}>
                    <IconButton onClick={onScreenShareClick}>
                        {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    </IconButton>
                </Tooltip>
                {/* Остальные контроли рендерятся только если есть комната */}
                {room && <VoiceControls />}
            </Box>
        </Paper>
    );
};

export default UserPanel; 