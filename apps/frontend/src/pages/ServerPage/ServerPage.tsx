import React from 'react';
import { Box } from '@mui/material';
import { useAppStore } from '@stores/useAppStore';
import { useContextMenuGuard } from '@hooks/useContextMenuGuard';

import {
  ServerPlaceholder,
  useServersQuery,
  useServersSocketSync,
} from '@features/servers';
import { ServersSidebar } from './components/ServersSidebar';
import { RoomWrapper } from './components/RoomWrapper';
import { ServerContent } from './components/ServerContent';

const ServerPage: React.FC = () => {
  useServersSocketSync();

  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: serversData = [] } = useServersQuery();
  const selectedServer =
    serversData.find((s) => s.id === selectedServerId) ?? null;

  // disable default context menu globally, allow only whitelisted elements
  useContextMenuGuard();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
      }}
    >
      {/* Горизонтальная панель серверов сверху */}
      <ServersSidebar />

      {/* Основное содержимое */}
      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
        {selectedServer ? (
          // Если сервер выбран
          <RoomWrapper
            server={selectedServer!}
            renderContent={() => false ? <></> : <ServerContent />}
          />
        ) : (
          // Ничего не выбрано: показываем лобби / плейсхолдер во всё оставшееся пространство
          <ServerPlaceholder />
        )}
      </Box>
    </Box>
  );
};

export default ServerPage;
