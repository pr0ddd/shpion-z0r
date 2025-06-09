import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import ServerContent from './ServerContent';
import ServerMembers from './ServerMembers';
import ScreenShareDisplay from './ScreenShareDisplay';
import { Box, CircularProgress, Typography } from '@mui/material';
import { livekitAPI } from '../services/api';
import { RoomInitialActions } from './RoomInitialActions';

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

    if (!selectedServer) {
        return (
            <Box sx={{ display: 'flex', height: '100%' }}>
                <ServerMembers isConnected={false} />
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1}>
                    <Typography>Пожалуйста, выберите сервер.</Typography>
                </Box>
            </Box>
        );
    }

    if (isLoading) {
        return (
             <Box sx={{ display: 'flex', height: '100%' }}>
                <ServerMembers isConnected={false} />
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }
    
    if (token && wsUrl) {
        return (
            <LiveKitRoom
                token={token}
                serverUrl={wsUrl}
                connect={true}
                audio={true}
                video={false}
                data-lk-theme="default"
            >
              <RoomInitialActions>
                <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
                    <ServerMembers isConnected={true} />
                    <ServerContent />
                </Box>
              </RoomInitialActions>
            </LiveKitRoom>
        );
    }

    // Fallback case for when there is no token after loading
    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <ServerMembers isConnected={false} />
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexGrow={1}>
                <Typography color="error">Не удалось подключиться к голосовому чату.</Typography>
            </Box>
        </Box>
    );
};

export default LiveKitManager; 