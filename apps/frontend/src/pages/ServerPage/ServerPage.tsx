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
        height: '100vh',
        width: '100vw',
      }}
    >
      {/* Колонка 1: список серверов (72px) */}
      <ServersSidebar />

      {/* Колонка 2 + 3: основное содержимое */}
      {selectedServer ? (
        // Если сервер выбран
        <RoomWrapper
          server={selectedServer!}
          renderContent={() => true ? <></> : <ServerContent />}
        />
      ) : (
        // Ничего не выбрано: показываем лобби / плейсхолдер во всё оставшееся пространство
        <ServerPlaceholder />
      )}
    </Box>
  );
};

export default ServerPage;
