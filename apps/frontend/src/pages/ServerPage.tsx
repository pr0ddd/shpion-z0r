import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';

import { LiveKitRoom } from '@libs/livekit/ui/templates/LiveKitRoom';

import { useServerStore } from '@entities/server/model';
import { LobbyTemplate, MediaControlPanel } from '@entities/server';

import { ServersTemplate } from '@entities/servers/ui';
import { useServersQuery } from '@entities/servers/api';
import { StreamsTemplate } from '@entities/streams/ui';
import { MembersTemplate } from '@entities/members/ui';
import { ChatMessages } from '@entities/chat';
import { Accordion } from '@ui/molecules/Accordion';
import { AccordionPanel } from '@ui/molecules/AccordionPanel';
import Badge from '@mui/material/Badge';
import { useUnreadStore } from '@entities/chat/model/unread.store';
import { useUnreadSocketSync } from '@entities/chat/model/useUnreadSocketSync';
import { useMembersQuery } from '@entities/members/api/members.query';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { IconButton } from '@ui/atoms/IconButton';

const ServerPage: React.FC = () => {
  const { selectedServerId } = useServerStore();
  // sync unread counts via socket regardless of chat panel mount
  useUnreadSocketSync(selectedServerId!);
  const { data: servers } = useServersQuery();
  const { data: members } = useMembersQuery(selectedServerId!);

  const [showInviteDialog, setShowInviteDialog] = useState(false);

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
                actions={
                  <IconButton
                    icon={<PersonAddAlt1Icon />}
                    hasBorder={false}
                    size="small"
                    onClick={(e)=>{
                      e.stopPropagation();
                      setShowInviteDialog(true);
                    }}
                  />
                }
              >
                <MembersTemplate />
              </AccordionPanel>

              <AccordionPanel
                title={<ChatTitleWithBadge serverId={selectedServerId!} />}
                headerHeight={56}
                height={2}
              >
                <ChatMessages />
              </AccordionPanel>
              {selectedServer && (
                <InviteDialog
                  open={showInviteDialog}
                  server={selectedServer}
                  onClose={() => setShowInviteDialog(false)}
                />
              )}
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

/* Helper component to show unread badge */
const ChatTitleWithBadge: React.FC<{ serverId: string }> = ({ serverId }) => {
  const unread = useUnreadStore((s) => s.counts[serverId] ?? 0);
  return (
    <Badge
      color="error"
      badgeContent={unread}
      invisible={unread === 0}
      sx={{ '.MuiBadge-badge': { right: -10, top: 6 } }}
    >
      Chat
    </Badge>
  );
};
