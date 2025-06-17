import React, { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ServersSidebar from './ServersSidebar';
import ServerContent from './ServerContent';
import { ServerMembers, StatsOverlay } from '@shared/livekit';
import { useServer } from '@shared/hooks';
import { LiveKitRoom, useRoomContext } from '@livekit/components-react';
import { ServerPlaceholder } from '@shared/ui';
import { useLiveKitToken } from '@shared/livekit';
import { VideoPresets, AudioPresets, RoomEvent } from 'livekit-client';

const CenteredLoader: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
    <CircularProgress />
  </Box>
);

const RoomConnectionWatcher: React.FC<{ onChange: (connected: boolean) => void }> = ({ onChange }) => {
  const room = useRoomContext();
  React.useEffect(() => {
    if (!room) return;
    const handleConnected = () => onChange(true);
    const handleReconnecting = () => onChange(false);
    const handleReconnected = () => onChange(true);
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [room, onChange]);
  return null;
};

const AppLayout: React.FC = () => {
  const { selectedServer, isLoading: isServerListLoading } = useServer();
  const { token: livekitToken, isLoading: isTokenLoading } = useLiveKitToken(selectedServer);
  const [isConnected, setConnected] = useState(false);

  if (isServerListLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#202225' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const canShowLiveKitRoom = !!selectedServer && !!livekitToken;

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#36393f' }}>
      <ServersSidebar />

      {canShowLiveKitRoom ? (
        <LiveKitRoom
          key={selectedServer!.id}
          token={livekitToken!}
          serverUrl={import.meta.env.VITE_LIVEKIT_URL as string}
          connect={true}
          video={false}
          audio={true}
          options={{
            adaptiveStream: false,
            dynacast: false,
            videoCaptureDefaults: {
              resolution: { ...VideoPresets.h720.resolution, frameRate: 30 },
            },
            publishDefaults: {
              videoCodec: 'av1',
              videoEncoding: {
                maxBitrate: 3_000_000,
                maxFramerate: 30,
              },
              backupCodec: { codec: 'h264', encoding: { maxBitrate: 3_000_000, maxFramerate: 30 } },
              screenShareEncoding: {
                maxBitrate: 3_000_000,
                maxFramerate: 30,
              },
              audioPreset: AudioPresets.music,
              dtx: true,
              red: true,
            },
          }}
          style={{ display: 'flex', flexGrow: 1, minWidth: 0, position: 'relative' }}
        >
          <RoomConnectionWatcher onChange={setConnected} />
          {!isConnected && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <CircularProgress size={48} />
            </Box>
          )}
          {isConnected && (
            <>
              <ServerMembers />
              <StatsOverlay />
              <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <ServerContent />
              </Box>
            </>
          )}
        </LiveKitRoom>
      ) : (
        <>
          {/* Ширина блока участников */}
          <Box
            sx={{
              width: 240,
              flexShrink: 0,
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#2f3136',
              height: '100vh',
            }}
          />
          {isTokenLoading ? <CenteredLoader /> : <ServerPlaceholder />}
        </>
      )}
    </Box>
  );
};

export default AppLayout; 