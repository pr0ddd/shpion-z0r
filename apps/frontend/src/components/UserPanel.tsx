import React from 'react';
import { Box, Typography, Avatar, Paper, Divider, IconButton } from '@mui/material';
import { useAuth } from '@shared/hooks';
import { ConnectionState, Room, Track } from 'livekit-client';
import { useConnectionState, useMaybeRoomContext, useTrackMutedIndicator, useTracks } from '@livekit/components-react';
import { useScreenShare } from '@shared/livekit';
import { useNotification } from '@shared/hooks';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { dicebearAvatar } from '@shared/ui';

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

    const { showNotification } = useNotification();
    const onMuteClick = () => {
        room.localParticipant.setMicrophoneEnabled(!isMuted);
    };

    const onCameraClick = async () => {
        try {
            await room.localParticipant.setCameraEnabled(!isCameraOn);
        } catch (err: any) {
            showNotification(err?.message || 'Cannot access camera', 'error');
        }
    };

    const onDisconnectClick = () => {
        room.disconnect();
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <IconButton onClick={onMuteClick}>
                {isMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
            <IconButton onClick={onCameraClick}>
                {isCameraOn ? <VideocamOffIcon /> : <VideocamIcon />}
            </IconButton>
            <IconButton onClick={onDisconnectClick} sx={{ color: 'error.main' }}>
                <CallEndIcon />
            </IconButton>
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
    const { toggle: toggleScreenShare, enabled: isScreenShareEnabled } = useScreenShare();
    const screenShareButtonProps = {
      onClick: toggleScreenShare,
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
                <Avatar src={user.avatar || dicebearAvatar(user.id)} sx={{ width: 32, height: 32, mr: 1.5 }}/>
                <Typography variant="body1" fontWeight="bold" noWrap>
                    {user.username}
                </Typography>
            </Box>
            
            <Divider />

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-around' }}>
                <IconButton {...screenShareButtonProps} color="default">
                    {isScreenShareEnabled ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
                {/* Остальные контроли рендерятся только если есть комната */}
                {room && <VoiceControls />}
            </Box>
        </Paper>
    );
};

export default UserPanel; 