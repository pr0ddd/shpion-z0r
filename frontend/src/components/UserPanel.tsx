import React from 'react';
import { Box, Typography, Avatar, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ConnectionState, Room, Track, VideoPresets, createLocalVideoTrack, createLocalScreenTracks, LocalTrack } from 'livekit-client';
import { useConnectionState, useMaybeRoomContext, useTrackMutedIndicator, useTracks } from '@livekit/components-react';
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

    const tracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera]);
    
    const isScreenSharing = tracks.some(
        (track) => track.participant.isLocal && track.source === Track.Source.ScreenShare
    );

    const isCameraOn = tracks.some(
        (track) => track.participant.isLocal && track.source === Track.Source.Camera
    );

    if (connectionState !== ConnectionState.Connected) {
        return null;
    }

    const onMuteClick = () => {
        room.localParticipant.setMicrophoneEnabled(!isMuted);
    };

    const onScreenShareClick = () => {
        room.localParticipant.setScreenShareEnabled(!isScreenSharing);
    }

    const onCameraClick = () => {
        room.localParticipant.setCameraEnabled(!isCameraOn);
    }

    const onDisconnectClick = () => {
        room.disconnect();
    };

    return (
        <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-around' }}>
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
                <Tooltip title={isScreenSharing ? "Stop Sharing" : "Share Screen"}>
                    <IconButton onClick={onScreenShareClick}>
                        {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Disconnect">
                    <IconButton onClick={onDisconnectClick} sx={{ color: 'error.main' }}>
                        <CallEndIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </>
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={user.avatar || undefined} sx={{ width: 32, height: 32, mr: 1.5 }}/>
                <Typography variant="body1" fontWeight="bold" noWrap>
                    {user.username}
                </Typography>
            </Box>
            <VoiceControls />
        </Paper>
    );
};

export default UserPanel; 