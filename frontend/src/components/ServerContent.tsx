import React, { useState } from 'react';
import { Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useServer } from '../contexts/ServerContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ServerMembers from './ServerMembers';
import InviteManager from './InviteManager';
import { useMaybeRoomContext, useTracks, VideoTrack } from '@livekit/components-react';
import { Track, Room } from 'livekit-client';

const MessagesPane = () => {
    const { selectedServer, messages } = useServer();
    if (!selectedServer) return null;

    return (
        <>
            <MessageList messages={messages} />
            <MessageInput serverId={selectedServer.id} />
        </>
    );
};

const ScreenSharePane = ({ trackRef }: { trackRef: any }) => {
    return (
        <Box sx={{ flexGrow: 1, p: 2, backgroundColor: 'black' }}>
            <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%' }} />
        </Box>
    );
};

// This component is only rendered when the room context is available.
const MainPaneWithRoom: React.FC<{ room: Room }> = ({ room }) => {
    const screenShareTracks = useTracks([Track.Source.ScreenShare], { room });
    if (screenShareTracks.length > 0) {
        return <ScreenSharePane trackRef={screenShareTracks[0]} />;
    }
    return <MessagesPane />;
}

const MainPane: React.FC = () => {
    const room = useMaybeRoomContext();
    // If we are not in a room context, just show the messages.
    if (!room) {
        return <MessagesPane />;
    }
    // If we are in a room, let the specialized component decide what to show.
    return <MainPaneWithRoom room={room} />;
};

const ServerContent: React.FC = () => {
  const { selectedServer } = useServer();
  const [isInviteManagerOpen, setInviteManagerOpen] = useState(false);

  if (!selectedServer) {
    return (
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          p: 3,
          backgroundColor: 'background.default'
        }}
      >
        <Typography variant="h5">Добро пожаловать в Shpion!</Typography>
        <Typography color="text.secondary">Выберите сервер слева, чтобы начать общение.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense">
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              # {selectedServer.name}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteManagerOpen(true)}
            >
              Пригласить
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          <ServerMembers />
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <MainPane />
          </Box>
        </Box>
      </Box>
      <InviteManager 
        open={isInviteManagerOpen} 
        onClose={() => setInviteManagerOpen(false)} 
      />
    </>
  );
};

export default ServerContent;