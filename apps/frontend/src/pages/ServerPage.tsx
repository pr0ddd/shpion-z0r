import React, { useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

import { LiveKitRoom } from '@libs/livekit/ui/templates/LiveKitRoom';

import { useServerStore } from '@entities/server/model';
import { MediaControlPanel } from '@entities/server';

import { ServersTemplate } from '@entities/servers/ui';
import { useServersQuery } from '@entities/servers/api';
import { StreamsTemplate } from '@entities/streams/ui';
import { MembersTemplate } from '@entities/members/ui';
import { Accordion } from '@ui/molecules/Accordion';
import { AccordionPanel } from '@ui/molecules/AccordionPanel';
import { useMembersQuery } from '@entities/members/api/members.query';
import { useCreateServerDialog } from '@entities/server/model';
import CreateServerDialog from '@entities/server/ui/organisms/CreateServerDialog';
import { useState } from 'react';
import { Fade } from '@mui/material';

const ServerPage: React.FC = () => {
  const { selectedServerId } = useServerStore();
  const { data: servers } = useServersQuery();
  const { data: members } = useMembersQuery(selectedServerId!);

  const selectedServer = useMemo(() => {
    if (!servers || !selectedServerId) return null;
    return servers.find((s) => s.id === selectedServerId) || null;
  }, [servers, selectedServerId]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'new.foreground',
            gap: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              zIndex: 0,
            },
          }}
        >
          <Typography
            component={motion.h3}
            variant="h3"
            sx={{ textShadow: '0 0 10px new.primary', zIndex: 1 }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            Enter the Shadows of Shpion <img src="/lobby.png" alt="Shpion" />
          </Typography>

          <Typography
            component={motion.p}
            variant="subtitle1"
            color="new.mutedForeground"
            sx={{ maxWidth: '600px', textAlign: 'center', zIndex: 1 }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            Your covert communication network awaits. Forge alliances, share secrets, and dominate the digital espionage world.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, zIndex: 1 }}>
            <Button
              component={motion.button}
              variant="contained"
              color="primary"
              onClick={() => setIsCreateDialogOpen(true)}
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px new.primary' }}
              transition={{ duration: 0.3 }}
            >
              Create Secret Server 
            </Button>
          </Box>
        </Box>
      )}

      <CreateServerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </Box>
  );
};

export default ServerPage;
