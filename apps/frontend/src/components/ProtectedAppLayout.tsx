import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { ServerMembers, StatsOverlay } from '@shared/livekit';
import { useServer } from '@shared/hooks';
import { LiveKitRoom } from '@livekit/components-react';
import { ServerPlaceholder } from '@shared/ui';
import { useLiveKitToken } from '@shared/livekit';
import { VideoPresets, AudioPresets } from 'livekit-client';

const RECONNECT_SECONDS = 5;

const Overlay: React.FC<{ seconds: number }> = ({ seconds }) => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#202225',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}
  >
    <Typography variant="h4" gutterBottom>
      Сервер голосового чата недоступен
    </Typography>
    <Typography variant="body1">
      Повторное подключение через {seconds}…
    </Typography>
  </Box>
);

const ConnectingOverlay: React.FC = () => (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'rgba(0,0,0,0.6)',
      zIndex: 1000,
    }}
  >
    <CircularProgress size={48} sx={{ mb: 2 }} />
    <Typography>Подключение…</Typography>
  </Box>
);

const CenteredLoader: React.FC = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
        <CircularProgress />
    </Box>
);

const ProtectedAppLayout: React.FC = () => {
    const { selectedServer, isLoading: isServerListLoading } = useServer();
    const { token: livekitToken, isLoading: isTokenLoading } = useLiveKitToken(selectedServer);

    const [shouldConnect, setShouldConnect] = useState(true);
    const [retryIn, setRetryIn] = useState<number | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    // reset when switching servers
    useEffect(() => {
        if (!selectedServer) return;
        setShouldConnect(true);
        setRetryIn(null);
        setAttempt((a) => a + 1);
    }, [selectedServer?.id]);

    // countdown logic
    useEffect(() => {
        if (retryIn === null) return;
        if (retryIn === 0) {
            setRetryIn(null);
            setAttempt((a) => a + 1);
            setShouldConnect(true);
            return;
        }
        const id = setTimeout(() => setRetryIn((s) => (s ?? 1) - 1), 1000);
        return () => clearTimeout(id);
    }, [retryIn]);

    const handleDisconnect = useCallback(() => {
        // Stop connecting if we got explicit reconnect attempt cancelled or failed
        setShouldConnect(false);
        setRetryIn(RECONNECT_SECONDS);
        setIsConnected(false);
    }, []);

    const handleConnected = useCallback(() => {
        setIsConnected(true);
    }, []);

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
                    key={`${selectedServer.id}-${attempt}`}
                    token={livekitToken}
                    serverUrl={import.meta.env.VITE_LIVEKIT_URL as string}
                    connect={shouldConnect}
                    video={false}
                    audio={true}
                    options={{
                        adaptiveStream: false,
                        dynacast: false,
                        videoCaptureDefaults: {
                            resolution: VideoPresets.h1080.resolution,
                        },
                        publishDefaults: {
                            // Базовый слой — 1080p @ 60 fps (~6 Мбит)
                            videoCodec: 'av1',
                            videoEncoding: {
                                maxBitrate: 8_000_000,
                                maxFramerate: 60,
                            },
                            // Без simulcast – публикуем только full-HD слой (принудительно)
                            videoSimulcastLayers: [],
                            // Настройки для шаринга экрана (оставляем 30 fps, т.к. для кода достаточно)
                            screenShareEncoding: {
                                maxBitrate: 12_000_000,
                                maxFramerate: 60,
                            },
                            audioPreset: AudioPresets.music,
                            dtx: true,
                            red: true,
                        },
                    }}
                    onConnected={handleConnected}
                    onDisconnected={handleDisconnect}
                    onError={handleDisconnect}
                    style={{ display: 'flex', flexGrow: 1, minWidth: 0, position: 'relative' }}
                >
                    {!isConnected && <ConnectingOverlay />}
                    {isConnected && (
                        <>
                          <ServerMembers />
                          <StatsOverlay />
                          <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                              <ServerContent />
                          </Box>
                        </>
                    )}
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