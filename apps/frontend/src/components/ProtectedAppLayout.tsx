import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { ServerMembers } from './ServerMembers';
import { useServer } from '@shared/hooks';
import { LiveKitRoom } from '@livekit/components-react';
import { ServerPlaceholder } from '@shared/ui';
import { useLiveKitToken } from '@shared/hooks';
import { VideoPresets } from 'livekit-client';

const CenteredLoader: React.FC = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
        <CircularProgress />
    </Box>
);

const ProtectedAppLayout: React.FC = () => {
    const { selectedServer, isLoading: isServerListLoading } = useServer();
    const { token: livekitToken, isLoading: isTokenLoading } = useLiveKitToken(selectedServer);

    if (isServerListLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#202225' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    const canShowLiveKitRoom = selectedServer && livekitToken;

    return (
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#36393f' }}>
            <ServersSidebar />

            {canShowLiveKitRoom ? (
                <LiveKitRoom
                    key={selectedServer.id}
                    token={livekitToken}
                    serverUrl={import.meta.env.VITE_LIVEKIT_URL as string}
                    connect={true}
                    video={false}
                    audio={true}
                    options={{
                        adaptiveStream: true,
                        dynacast: true,
                        videoCaptureDefaults: {
                            resolution: VideoPresets.h1080.resolution,
                        },
                        publishDefaults: {
                            videoCodec: 'vp8',
                            videoEncoding: {
                                maxBitrate: 2_500_000,
                            },
                            screenShareEncoding: {
                                maxBitrate: 10_000_000,
                                maxFramerate: 60,
                            },
                        },
                    }}
                    style={{ display: 'flex', flexGrow: 1, minWidth: 0 }}
                >
                    <ServerMembers />
                    <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <ServerContent />
                    </Box>
                </LiveKitRoom>
            ) : (
                <>
                    {/* This placeholder simulates the width of ServerMembers */}
                    <Box sx={{ 
                        width: 240, 
                        flexShrink: 0,
                        borderRight: '1px solid rgba(255, 255, 255, 0.12)', 
                        background: '#2f3136',
                        height: '100vh'
                    }} />
                    {isTokenLoading ? <CenteredLoader /> : <ServerPlaceholder />}
                </>
            )}
        </Box>
    );
};

export default ProtectedAppLayout; 