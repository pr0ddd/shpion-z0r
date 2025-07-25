import React, { useMemo, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import { LiveKitRoom } from '@libs/livekit/ui/templates/LiveKitRoom';

import { useServerStore } from '@entities/server/model';
import { LobbyTemplate } from '@entities/server';

import { ServersTemplate, MediaControlsSection } from '@entities/servers/ui';
import { useServersQuery } from '@entities/servers/api';
import { StreamsTemplate } from '@entities/streams/ui';
import { useStream } from '@entities/streams/model/useStream';
import { MembersTemplate } from '@entities/members/ui';
import { ChatMessages } from '@entities/chat';
import { Accordion } from '@ui/molecules/Accordion';
import { AccordionPanel } from '@ui/molecules/AccordionPanel';
import Badge from '@mui/material/Badge';
import { useUnreadStore } from '@entities/chat/model/unread.store';
import { useUnreadSocketSync } from '@entities/chat/model/useUnreadSocketSync';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useMembersQuery } from '@entities/members/api/members.query';
import InviteDialog from '@entities/server/ui/organisms/InviteDialog';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { IconButton } from '@ui/atoms/IconButton';
import { ServerHeader } from '@entities/server/ui/organisms/ServerHeader';

const ServerPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('mobile'));
  const isVeryNarrow = useMediaQuery(theme.breakpoints.down('narrowMobile'));
  const isCollapsedSidebar = useMediaQuery(theme.breakpoints.down('sidebarCollapse'));
  const isNarrowRight = useMediaQuery(theme.breakpoints.down('narrowRight'));
  const { selectedServerId, setSelectedServerId } = useServerStore();
  // sync unread counts via socket regardless of chat panel mount
  useUnreadSocketSync(selectedServerId!);
  const { data: servers } = useServersQuery();
  const { data: members } = useMembersQuery(selectedServerId!);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  // Mobile bottom bar removed; unified control panel used on all sizes

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
      {selectedServerId ? (
        <>
        <LiveKitRoom
          serverId={selectedServerId!}
          isLoadingServer={!selectedServer}
          sfuId={selectedServer?.sfuId ?? 'default'}
          sfuUrl={
            selectedServer?.sfu?.url ??
            (import.meta.env.VITE_LIVEKIT_URL as string)
          }
        >
          {/* Layout: column -> header on top, rest content below */}
          <Box sx={{ display:'flex', flexDirection:'column', width:'100%', height:'100%', minWidth:0 }}>
    

            <Box sx={{ display: 'flex', flex: 1, minWidth: 0, minHeight:0 }}>
            {/* Sidebars (left + right) with shared media controls */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight:0, borderRight:'1px solid', borderColor:'new.border', backgroundColor:'new.card', flex: isVeryNarrow ? 1 : '0 0 auto', }}>
              {/* Row with both sidebars */}
              <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight:0 }}>
                <ServersTemplate collapsed={isCollapsedSidebar} />

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'new.card',
                    borderLeft: '1px solid',
                    borderColor: 'new.border',
                    flex: 1,
                  }}
                >
                  {/* Header now inside members sidebar */}
                  <Box sx={{ p:0.5, borderBottom:'1px solid', borderColor:'new.border' }}>
                    <ServerHeader />
                  </Box>
                  <Accordion>
                      <MembersTemplate />

                    {/* Chat panel inside members accordion removed – chat will now live next to stream */}
                  </Accordion>
                </Box>
              </Box>

              {/* Shared media controls row */}
              <Box sx={{ mt: 'auto', px: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <MediaControlsSection />
                </Box>
              </Box>
            </Box>

            {!isVeryNarrow && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  height: '100%',
                  minWidth: 0,
                }}
              >
                <CentralColumn />
              </Box>
            )}

            {selectedServer && (
              <InviteDialog
                open={showInviteDialog}
                server={selectedServer}
                onClose={() => setShowInviteDialog(false)}
              />
            )}

            {/* Mobile Chat Drawer moved outside */}
 
            </Box>{/* end inner row */}
          </Box>{/* end column */}

        </LiveKitRoom>
        {isMobile && (
        <SwipeableDrawer
          anchor="right"
          open={mobileChatOpen}
          onClose={() => setMobileChatOpen(false)}
          onOpen={() => setMobileChatOpen(true)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100vw',
              maxWidth: '100vw',
              backgroundColor: 'new.background',
            },
          }}
        >
          <ChatMessages />
        </SwipeableDrawer>
        )}
        </>
      ) : (
        <>
          <ServersTemplate />
          <LobbyTemplate />
        </>
      )}
    </Box>
  );
};

export default ServerPage;

/* -------- Nested components -------- */

/* Central column: shows Chat by default, Streams with side chat when active */
const CentralColumn: React.FC = () => {
  const { streamTracks } = useStream();
  const hasActiveStreams = streamTracks.length > 0;

  // Hide side-chat on narrow screens (<1024px) just like original sidebar collapse behaviour
  const isNarrow = useMediaQuery('(max-width:1023.95px)');

  if (!hasActiveStreams) {
    // No live streams – keep existing behaviour
    return <ChatMessages />;
  }

  // Streams are active – split area: stream (left) and chat (right)
  return (
    <Box sx={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0 }}>
      {/* Active streams */}
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex' }}>
        <StreamsTemplate />
      </Box>

      {/* Chat column – hidden on very narrow layouts */}
      {!isNarrow && (
        <Box
          sx={{
            width: 340,
            maxWidth: '100%',
            borderLeft: '1px solid',
            borderColor: 'new.border',
            backgroundColor: 'new.card',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <ChatMessages />
        </Box>
      )}
    </Box>
  );
};

/* Sidebar Chat – visible only when streams are active */
const SidebarChatPanel: React.FC<{ serverId: string }> = ({ serverId }) => {
  const { streamTracks } = useStream();
  const hasActiveStreams = streamTracks.length > 0;

  if (!hasActiveStreams) return null;

  return (
    <AccordionPanel
      title={<ChatTitleWithBadge serverId={serverId} />}
      headerHeight={56}
      height={2}
    >
      <ChatMessages />
    </AccordionPanel>
  );
};

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
