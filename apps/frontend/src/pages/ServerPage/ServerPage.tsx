import React from 'react';
import { Box } from '@mui/material';
import { useAppStore } from '@stores/useAppStore';
import { useContextMenuGuard } from '@hooks/useContextMenuGuard';

import { ServerPlaceholder, useServersQuery, useServersSocketSync } from '@features/servers';
import { ServersSidebar } from './components/ServersSidebar';
import { RoomWrapper } from './components/RoomWrapper';
import { ServerContent } from './components/ServerContent';

const ServerPage: React.FC = () => {
  useServersSocketSync();

  const selectedServerId = useAppStore((s) => s.selectedServerId);
  const { data: serversData = [], isLoading: isServersLoading } =
    useServersQuery();
  const selectedServer =
    serversData.find((s) => s.id === selectedServerId) ?? null;

  // disable default context menu globally, allow only whitelisted elements
  useContextMenuGuard();

  // if (isServersLoading) {
  //   return (
  //     <Box
  //       sx={{
  //         display: 'flex',
  //         justifyContent: 'center',
  //         alignItems: 'center',
  //         width: '100vw',
  //         height: '100vh',
  //         backgroundColor: '#202225',
  //       }}
  //     >
  //       <CircularProgress size={60} />
  //     </Box>
  //   );
  // }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#36393f',
        width: '100vw',
      }}
    >
      {/* Колонка 1: список серверов (72px) */}
      <ServersSidebar />

      {/* Колонка 2 + 3: основное содержимое */}
      {selectedServer ? (
        // Если сервер выбран
        <Box sx={{ display: 'flex', flexGrow: 1, minWidth: 0 }}>
          {/* Правая часть – всё содержимое сервера */}
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <RoomWrapper
              server={selectedServer!}
              renderContent={() => <ServerContent />}
            />
          </Box>
        </Box>
      ) : (
        // Ничего не выбрано: показываем лобби / плейсхолдер во всё оставшееся пространство
        <Box sx={{ flexGrow: 1 }}>
          <ServerPlaceholder />
        </Box>
      )}
    </Box>
  );
};

export default ServerPage;
