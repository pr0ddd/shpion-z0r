import React, { useState } from 'react';
import { Box, CircularProgress, Typography, Snackbar } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { ServerMembers, StatsOverlay } from '@shared/livekit';
import { useAppStore, useServersQuery, useServersSocketSync, useSelectServer } from '@shared/hooks';
import { LiveKitRoom, useRoomContext } from '@livekit/components-react';
import { ServerPlaceholder } from '@shared/ui';
import { useLiveKitToken } from '@shared/livekit';
import { VideoPresets, AudioPresets, RoomEvent } from 'livekit-client';
import { useContextMenuGuard } from '@shared/ui';

// Use LiveKit 1080p preset for encoding parameters (30fps, ~4.5-6 Mbps)
const motion1080p30 = VideoPresets.h1080;

// Custom 1080p @60 fps VP8 (≈4 Mbps) for camera and screen share
const encoding1080p30_2m = {
  maxBitrate: 2_000_000, // 4 Mbps
  maxFramerate: 30,
} as const;

const screenShare60fps = encoding1080p30_2m; // reuse for screen share

const CenteredLoader: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
    <CircularProgress />
  </Box>
);

const RoomConnectionWatcher: React.FC<{ onChange: (connected: boolean) => void }> = ({ onChange }) => {
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

const AppLayout: React.FC = () => {
  useServersSocketSync();

  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: serversData = [], isLoading: isServersLoading } = useServersQuery();
  const selectedServer = serversData.find((s) => s.id === selectedServerId) ?? null;

  const { token: livekitToken, isLoading: isTokenLoading } = useLiveKitToken(selectedServer);
  const [isConnected, setConnected] = useState(false);

  // disable default context menu globally, allow only whitelisted elements
  useContextMenuGuard();

  const transition = useAppStore((s) => s.transition);

  // В режиме разработки всегда используем адрес SFU из переменной окружения,
  // чтобы локальная сборка могла подключаться к тестовому серверу, независимо
  // от записей в базе. На продакшене логика остаётся прежней – сначала берём
  // URL из выбранного сервера, а если его нет, используем переменную среды
  // как запасной вариант.
  const serverUrl: string | undefined = import.meta.env.DEV
    ? ((import.meta.env.VITE_LIVEKIT_URL as string) || undefined)
    : selectedServer
        ? selectedServer.sfu?.url ?? (import.meta.env.VITE_LIVEKIT_URL as string)
        : undefined;

  // Отключили health-проверку SFU: считаем сервер всегда доступным.
  const sfuOk = true;
  const sfuChecking = false;

  const selectServer = useSelectServer();
  const [snackOpen, setSnackOpen] = useState(false);

  React.useEffect(() => {
    if (!sfuChecking && selectedServer && !sfuOk) {
      selectServer(null);
      setSnackOpen(true);
    }
  }, [sfuChecking, sfuOk, selectedServer, selectServer]);

  const canShowLiveKitRoom = !!selectedServer && !!livekitToken && sfuOk;

  // Показываем оверлей, пока мы ещё не готовы полностью показать комнату
  const showTransition = !!selectedServer && (isTokenLoading || sfuChecking || transition.active || !isConnected);

  if (isServersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#202225' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#36393f' }}>
      <ServersSidebar />

      {canShowLiveKitRoom ? (
        <LiveKitRoom
          key={`${selectedServer!.id}-${selectedServer!.sfuId ?? 'default'}`}
          token={livekitToken!}
          serverUrl={serverUrl}
          connect={true}
          video={false}
          audio={true}
          options={{
            adaptiveStream: false,
            dynacast: false,
            publishDefaults: {
              videoCodec: 'av1',
              videoEncoding: encoding1080p30_2m,
              screenShareEncoding: screenShare60fps,
              audioPreset: AudioPresets.speech,
              dtx: true,
              red: false,
            },
            audioCaptureDefaults: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }}
          style={{ display: 'flex', flexGrow: 1, minWidth: 0, position: 'relative' }}
        >
          <RoomConnectionWatcher onChange={setConnected} />
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
          {/* Ширина блока участников */}
          <Box
            sx={{
              width: 240,
              flexShrink: 0,
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#2f3136',
              height: '100vh',
            }}
          />
          {/* Когда идёт переход на сервер (загрузка токена / мемберов / соединение) отображается глобальный оверлей */}
          {selectedServer ? null : <ServerPlaceholder />}
        </>
      )}

      {/* Глобальный оверлей перехода */}
      {showTransition && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ textAlign: 'center' }}>{transition.text ?? 'Загрузка...'}</Typography>
        </Box>
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        message="SFU недоступен, вы перемещены в лобби"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AppLayout; 