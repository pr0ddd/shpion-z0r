import React, { useState } from 'react';
import { Box, CircularProgress, Snackbar } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import { useAppStore, useServersQuery, useServersSocketSync, useSelectServer } from '@shared/hooks';
import { ServerPlaceholder } from '@shared/ui';
import { useLiveKitToken } from '@shared/livekit';
import { useContextMenuGuard } from '@shared/ui';
import { RoomWrapper } from './RoomWrapper';

const AppLayout: React.FC = () => {
  useServersSocketSync();

  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: serversData = [], isLoading: isServersLoading } = useServersQuery();
  const selectedServer = serversData.find((s) => s.id === selectedServerId) ?? null;

  const { token: livekitToken } = useLiveKitToken(selectedServer);

  // disable default context menu globally, allow only whitelisted elements
  useContextMenuGuard();

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

  if (isServersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#202225' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#36393f', width: '100vw' }}>
      {/* Колонка 1: список серверов (72px) */}
      <ServersSidebar />

      {/* Колонка 2 + 3: основное содержимое */}
      {selectedServer ? (
        // Если сервер выбран
        <Box sx={{ display: 'flex', flexGrow: 1, minWidth: 0 }}>
          {/* Правая часть – всё содержимое сервера */}
          <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {canShowLiveKitRoom ? <RoomWrapper server={selectedServer!} /> : <ServerPlaceholder />}
          </Box>
        </Box>
      ) : (
        // Ничего не выбрано: показываем лобби / плейсхолдер во всё оставшееся пространство
        <Box sx={{ flexGrow: 1 }}>
          <ServerPlaceholder />
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