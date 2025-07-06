import { useServerStore } from '@entities/server/model';
import { useServersQuery } from '@entities/servers/api';
import { Box } from '@mui/material';
import { useMemo } from 'react';

import { LiveKitRoom } from '@components/LiveKitRoom/LiveKitRoom';
import { StreamsTemplate } from '@entities/streams/ui';
import { ChatMessages, ChatMessagesList } from '@entities/chat/ui';
import { MediaControlPanel } from '../organisms/MediaControlPanel';

export const ServerLayout: React.FC = () => {
  // const theme = useTheme();
  const { selectedServerId } = useServerStore();

  return (
    <LiveKitRoom
      serverId={selectedServerId!}
      isLoadingServer={!selectedServer}
      sfuId={selectedServer?.sfuId ?? 'default'}
      sfuUrl={
        selectedServer?.sfu?.url ?? (import.meta.env.VITE_LIVEKIT_URL as string)
      }
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexGrow: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '300px',
            flexShrink: 0,
            backgroundColor: '#2f3136',
          }}
        >

        </Box>
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            backgroundColor: '#36393f',
            flexDirection: 'column',
          }}
        >

          <Box
            sx={{
              padding: 1,
            }}
          >
            <MediaControlPanel />
          </Box>
        </Box>
      </Box>
    </LiveKitRoom>
  );
};
