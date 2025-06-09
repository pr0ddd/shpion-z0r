import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { useServer } from '../contexts/ServerContext';
import { useAuth } from '../contexts/AuthContext';
import ServerContent from './ServerContent';
import ServerMembers from './ServerMembers';
import { Box, CircularProgress, Typography } from '@mui/material';
import { livekitAPI } from '../services/api';

const LiveKitManager: React.FC = () => {
    const { selectedServer } = useServer();
    const { user } = useAuth();
    const [token, setToken] = useState<string | undefined>();
    const [wsUrl, setWsUrl] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (selectedServer && user) {
            setIsLoading(true);
            setToken(undefined);
            setWsUrl(undefined);
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
                } finally {
                    setIsLoading(false);
                }
            };
            getToken();
        } else {
            setToken(undefined);
            setWsUrl(undefined);
        }
    }, [selectedServer, user]);

    // Apply a container with full height to all states
    return (
        <Box sx={{ height: '100%' }}>
            {(() => {
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
                            data-lk-theme="default"
                        >
                            <Box sx={{ display: 'flex', height: '100%' }}>
                                <ServerMembers isConnected={true} />
                                <ServerContent />
                            </Box>
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
            })()}
        </Box>
    );
};

export default LiveKitManager; 