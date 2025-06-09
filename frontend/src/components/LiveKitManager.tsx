import React, { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    useConnectionState,
    useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import ServerContent from './ServerContent';
import ServerMembers from './ServerMembers';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { livekitAPI } from '../services/api';
import { ConnectionState } from 'livekit-client';

const RoomLayout = () => {
    const connectionState = useConnectionState();
    const { localParticipant } = useLocalParticipant();

    useEffect(() => {
        if (connectionState === ConnectionState.Connected && localParticipant) {
            // Ensure mic is muted on initial connection
            if (localParticipant.isMicrophoneEnabled) {
                localParticipant.setMicrophoneEnabled(false);
            }
        }
    }, [connectionState, localParticipant]);

    if (connectionState === ConnectionState.Connecting) {
        return (
            <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                <ServerMembers isConnected={false} />
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1} flexDirection="column">
                    <CircularProgress />
                    <Typography sx={{ mt: 2, color: 'text.secondary' }}>Подключение к голосовому чату...</Typography>
                </Box>
            </Box>
        );
    }

    if (connectionState === ConnectionState.Connected) {
        return (
            <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                <ServerMembers isConnected={true} />
                <ServerContent />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
            <ServerMembers isConnected={false} />
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1} flexDirection="column">
                <Typography color="error">Соединение потеряно.</Typography>
                 <Typography sx={{ mt: 1, color: 'text.secondary' }}>Попытка переподключения...</Typography>
            </Box>
        </Box>
    );
};

const LiveKitManager: React.FC = () => {
    const { selectedServer } = useServer();
    const { user } = useAuth();
    const [token, setToken] = useState<string | undefined>();
    const [wsUrl, setWsUrl] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (selectedServer && user) {
            setIsLoading(true);
            const getToken = async () => {
                try {
                    const response = await livekitAPI.getVoiceToken(selectedServer.id);
                    if (response.success && response.data) {
                        setToken(response.data.token);
                        setWsUrl(response.data.wsUrl);
                    } else {
                        throw new Error(response.error || 'Failed to fetch LiveKit token');
                    }
                } catch (err: any) {
                    console.error('Error fetching LiveKit token:', err);
                    setToken(undefined);
                    setWsUrl(undefined);
                } finally {
                    setIsLoading(false);
                }
            };
            getToken();
        } else {
            setToken(undefined);
            setWsUrl(undefined);
            setIsLoading(false);
        }
    }, [selectedServer, user]);

    // Initial state before a server is selected
    if (!selectedServer) {
        return (
            <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                <ServerMembers isConnected={false} />
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1}>
                    <Typography>Пожалуйста, выберите сервер.</Typography>
                </Box>
            </Box>
        );
    }

    // Loading state while fetching the token
    if (isLoading) {
        return (
             <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                <ServerMembers isConnected={false} />
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }
    
    // Once token is fetched, we attempt to connect to the room
    if (token && wsUrl) {
        return (
            <Fade in timeout={500}>
                <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                    <LiveKitRoom
                        key={selectedServer.id}
                        token={token}
                        serverUrl={wsUrl}
                        connect={true}
                        audio={{ noiseSuppression: true }}
                        video={false}
                        data-lk-theme="default"
                    >
                        <RoomLayout />
                    </LiveKitRoom>
                </Box>
            </Fade>
        );
    }

    // Fallback if token fetching fails
    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
            <ServerMembers isConnected={false} />
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1}>
                <Typography color="error">Не удалось подключиться к голосовому чату.</Typography>
            </Box>
        </Box>
    );
};

export default LiveKitManager; 