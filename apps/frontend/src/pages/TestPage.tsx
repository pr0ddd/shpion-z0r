import React, { useMemo } from 'react';
import { Box } from '@mui/material';

import { ServersTemplate } from '@entities/servers/ui';
import { useServerStore } from '@entities/server/model';
import { useServersQuery } from '@entities/servers/api';
import { LiveKitRoom } from '@components/LiveKitRoom/LiveKitRoom';
import { StreamsTemplate } from '@entities/streams/ui';
import { MediaControlPanel } from '@entities/server/ui';
import { MembersTemplate } from '@entities/members/ui';
import { Accordion } from '@ui/molecules/Accordion';
import { AccordionPanel } from '@ui/molecules/AccordionPanel';
import { useMembersQuery } from '@entities/members/api/members.query';
import { useChatWindowStore } from '@entities/chat/model/chatWindow.store';

const TestPage: React.FC = () => {
  const { selectedServerId } = useServerStore();
  const { data: servers } = useServersQuery();
  const { data: members } = useMembersQuery(selectedServerId!);
  const openChat = useChatWindowStore((s) => s.open);
  const closeChat = useChatWindowStore((s) => s.close);

  const selectedServer = useMemo(() => {
    if (!servers || !selectedServerId) return null;
    return servers.find((s) => s.id === selectedServerId) || null;
  }, [servers, selectedServerId]);

  return (
    <Box
      sx={{
        backgroundColor: 'new.background',
        width: '100vw',
        height: '100vh',
        display: 'flex',
      }}
    >
      <ServersTemplate />

      {selectedServerId ? (
        <LiveKitRoom
          serverId={selectedServerId!}
          isLoadingServer={!selectedServer}
          sfuId={selectedServer?.sfuId ?? 'default'}
          sfuUrl={
            selectedServer?.sfu?.url ??
            (import.meta.env.VITE_LIVEKIT_URL as string)
          }
        >
          <Box
            sx={{
              display: 'flex',
              flex: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              <StreamsTemplate />
              <MediaControlPanel />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'new.card',
                width: '384px',
                borderLeft: '1px solid',
                borderColor: 'new.border',
                paddingTop: 1,
              }}
            >
              <Accordion>
                <AccordionPanel
                  title="Users"
                  disabled={true}
                  subtitle={`${members?.length} members`}
                >
                  <MembersTemplate />
                </AccordionPanel>
              </Accordion>
            </Box>
          </Box>
        </LiveKitRoom>
      ) : (
        <div>No server selected</div>
      )}
    </Box>
  );
};

export default TestPage;
