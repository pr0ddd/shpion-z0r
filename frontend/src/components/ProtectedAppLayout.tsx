import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { useServer } from '../contexts/ServerContext';
import { livekitAPI } from '../services/api';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { LiveKitPresence } from '../contexts/LiveKitPresence';

const ProtectedAppLayout: React.FC = () => {
    const { selectedServer } = useServer();
    const [livekitToken, setLivekitToken] = useState<string | null>(null);

    useEffect(() => {
        if (selectedServer) {
            livekitAPI.getVoiceToken(selectedServer.id)
                .then(res => {
                    if (res.success && res.data) {
                        setLivekitToken(res.data.token);
                    }
                })
                .catch(err => {
                    console.error("Failed to get livekit token", err);
                    setLivekitToken(null);
                });
        } else {
            setLivekitToken(null);
        }
    }, [selectedServer]);

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <ServersSidebar />
            {selectedServer && livekitToken ? (
                <LiveKitRoom
                    token={livekitToken}
                    serverUrl={process.env.REACT_APP_LIVEKIT_URL}
                    connect={true}
                    audio={true}
                    onDisconnected={() => setLivekitToken(null)}
                >
                    <ServerContent />
                    <RoomAudioRenderer />
                    <LiveKitPresence />
                </LiveKitRoom>
            ) : (
                <ServerContent />
            )}
        </Box>
    );
};

export default ProtectedAppLayout; 