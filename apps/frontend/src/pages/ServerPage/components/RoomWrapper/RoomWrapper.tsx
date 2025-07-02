// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LiveKitRoom, useRoomContext } from '@livekit/components-react';
import { AudioPresets, RoomEvent } from 'livekit-client';
import { useStreamViewStore } from '@features/streams';
import { useAppStore } from '@stores/useAppStore';
import { useDeepFilter } from '@features/audio';

import type { Server } from '@shared/types';

import { StatsOverlay } from './components/StatsOverlay';
import { ServerMembers } from './components/ServerMembers';
import { useLiveKitToken } from './useLiveKitToken';

// Fixed 1080p @30 fps, 3 Mbps encoding for both camera and screen share.
const encoding1080p30_3m = {
  maxBitrate: 3_000_000,
  maxFramerate: 30,
} as const;

interface RoomWrapperProps {
  server: Server;
  renderContent: () => React.ReactNode;
}

export const RoomWrapper: React.FC<RoomWrapperProps> = ({
  server,
  renderContent,
}) => {
  const { token: livekitToken, isLoading: isTokenLoading } =
    useLiveKitToken(server);
  const [isConnected, setConnected] = useState(false);
  const transition = useAppStore((s) => s.transition);
  const showStats = useStreamViewStore((s: any) => s.showStats);

  // 🎤 DeepFilterNet состояние
  const [deepFilterEnabled, setDeepFilterEnabled] = useState(false);
  const [deepFilterSettings, setDeepFilterSettings] = useState({
    attenLim: 100,        // дБ ослабления
    postFilterBeta: 0.05  // пост-фильтр
  });

  // 🎤 Инициализируем DeepFilter (AudioWorklet)
  const { processor: deepFilterProcessor, isReady: isDeepFilterReady, error: deepFilterError, isLoading: isDeepFilterLoading } = useDeepFilter({
    enabled: deepFilterEnabled,
    ...deepFilterSettings
  });

  useEffect(() => {
    console.log('RoomWrapper', RoomWrapper);
    console.log('🎤 DeepFilter:', { deepFilterEnabled, isDeepFilterReady, deepFilterError });
  }, [deepFilterEnabled, isDeepFilterReady, deepFilterError]);

  const serverUrl: string | undefined = import.meta.env.DEV
    ? (import.meta.env.VITE_LIVEKIT_URL as string) || undefined
    : server.sfu?.url ?? (import.meta.env.VITE_LIVEKIT_URL as string);

  // 🎤 Настройки аудио с DeepFilter
  const audioCaptureDefaults = useMemo(() => ({
    echoCancellation: true,
    noiseSuppression: !deepFilterEnabled, // Отключаем встроенное, если DeepFilter включен
    autoGainControl: true,
    voiceIsolation: false,                // Отключаем, используем DeepFilter
  }), [deepFilterEnabled]);

  const canShow = !!livekitToken;
  const showOverlay = isTokenLoading || transition || !isConnected;

  const RoomConnectionWatcher: React.FC<{
    onChange: (connected: boolean) => void;
  }> = ({ onChange }) => {
    const room = useRoomContext();
    React.useEffect(() => {
      if (!room) return;
      const handleConnected = () => onChange(true);
      const handleReconnecting = () => onChange(false);
      const handleReconnected = () => onChange(true);
      room.on(RoomEvent.Connected, handleConnected);
      room.on(RoomEvent.Reconnecting, handleReconnecting);
      room.on(RoomEvent.Reconnected, handleReconnected);
      return () => {
        room.off(RoomEvent.Connected, handleConnected);
        room.off(RoomEvent.Reconnecting, handleReconnecting);
        room.off(RoomEvent.Reconnected, handleReconnected);
      };
    }, [room, onChange]);
    return null;
  };

  if (!canShow) return null;

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, minWidth: 0 }}>
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            position: 'relative',
            display: 'flex',
          }}
        >
          <LiveKitRoom
            key={`${server.id}-${server.sfuId ?? 'default'}`}
            token={livekitToken!}
            serverUrl={serverUrl}
            connect
            video={false}
            audio
            options={{
              adaptiveStream: true,
              dynacast: true,
              publishDefaults: {
                videoCodec: 'av1',
                videoEncoding: encoding1080p30_3m,
                screenShareEncoding: encoding1080p30_3m,
                audioPreset: AudioPresets.musicHighQuality,
                dtx: true,
                red: false,
              },
              audioCaptureDefaults,
            }}
            style={{
              display: 'flex',
              flexGrow: 1,
              minWidth: 0,
              position: 'relative',
            }}
          >
            <RoomConnectionWatcher onChange={setConnected} />
            {isConnected && (
              <Box
                sx={{
                  display: 'flex',
                  flexGrow: 1,
                  width: '100%',
                  height: '100%',
                  minWidth: 0,
                }}
              >
                {/* Sidebar members list */}
                <ServerMembers 
                  deepFilterSettings={{ enabled: deepFilterEnabled, ...deepFilterSettings }}
                  onDeepFilterChange={(settings) => {
                    setDeepFilterEnabled(settings.enabled);
                    setDeepFilterSettings({
                      attenLim: settings.attenLim,
                      postFilterBeta: settings.postFilterBeta
                    });
                  }}
                  deepFilterState={{ processor: deepFilterProcessor, isReady: isDeepFilterReady, error: deepFilterError, isLoading: isDeepFilterLoading }}
                />

                {/* Main content */}
                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}
                >
                  {renderContent()}
                  {showStats && <StatsOverlay />}
                </Box>
              </Box>
            )}
          </LiveKitRoom>

          {showOverlay && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.75)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 3000,
              }}
            >
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ textAlign: 'center' }}>
                {'Загрузка...'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
