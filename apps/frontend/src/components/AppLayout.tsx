import React, { useState } from 'react';
import { Box, CircularProgress, Typography, Snackbar } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { useAppStore, useServersQuery, useServersSocketSync, useSelectServer } from '@shared/hooks';
import { LiveKitRoom, useRoomContext } from '@livekit/components-react';
import { ServerPlaceholder } from '@shared/ui';
import { useLiveKitToken } from '@shared/livekit';
import { AudioPresets, RoomEvent } from 'livekit-client';
import { useContextMenuGuard } from '@shared/ui';
import { RoomWrapper } from './RoomWrapper';

// Fixed 1080p @30 fps, 3 Mbps encoding for both camera and screen share.
const encoding1080p30_3m = {
  maxBitrate: 3_000_000, // 3 Mbps
  maxFramerate: 30,
} as const;

const screenShareEncoding = encoding1080p30_3m;

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
  const showTransition = !!selectedServer && (isTokenLoading || sfuChecking || transition.active);

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
        <RoomWrapper server={selectedServer!} />
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