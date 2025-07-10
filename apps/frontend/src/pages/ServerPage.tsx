import React, { useMemo } from 'react';
import { Box } from '@mui/material';

import { LiveKitRoom } from '@libs/livekit/ui/templates/LiveKitRoom';

import { useServerStore } from '@entities/server/model';
import { LobbyTemplate, MediaControlPanel } from '@entities/server';

import { ServersTemplate } from '@entities/servers/ui';
import { useServersQuery } from '@entities/servers/api';
import { StreamsTemplate } from '@entities/streams/ui';
import { MembersTemplate } from '@entities/members/ui';
import { Accordion } from '@ui/molecules/Accordion';
import { AccordionPanel } from '@ui/molecules/AccordionPanel';
import { useMembersQuery } from '@entities/members/api/members.query';

const ServerPage: React.FC = () => {
  const { selectedServerId } = useServerStore();
  const { data: servers } = useServersQuery();
  const { data: members } = useMembersQuery(selectedServerId!);

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
              flexDirection: 'column',
              flex: 1,
              height: '100vh',
              minWidth: 0,
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
              flexShrink: 0,
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
        </LiveKitRoom>
      ) : (
        <LobbyTemplate />
      )}
    </Box>
  );
};

export default ServerPage;
