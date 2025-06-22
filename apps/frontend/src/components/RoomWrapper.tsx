import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LiveKitRoom, useRoomContext } from '@livekit/components-react';
import { useLiveKitToken } from '@shared/livekit';
import { AudioPresets, RoomEvent } from 'livekit-client';
import { ServerMembers, StatsOverlay } from '@shared/livekit';
import ServerContent from './ServerContent';
import { useAppStore } from '@shared/hooks';
import type { Server } from '@shared/types';

// Fixed 1080p @30 fps, 3 Mbps encoding for both camera and screen share.
const encoding1080p30_3m = {
  maxBitrate: 3_000_000,
  maxFramerate: 30,
} as const;

interface RoomWrapperProps {
  server: Server;
}

export const RoomWrapper: React.FC<RoomWrapperProps> = ({ server }) => {
  const { token: livekitToken, isLoading: isTokenLoading } = useLiveKitToken(server);
  const [isConnected, setConnected] = useState(false);
  const transition = useAppStore((s) => s.transition);

  const serverUrl: string | undefined = import.meta.env.DEV
    ? ((import.meta.env.VITE_LIVEKIT_URL as string) || undefined)
    : server.sfu?.url ?? (import.meta.env.VITE_LIVEKIT_URL as string);

  const canShow = !!livekitToken;
  const showOverlay = isTokenLoading || transition.active || !isConnected;

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

  if (!canShow) return null;

  return (
    <Box sx={{ flexGrow: 1, minWidth: 0, position: 'relative', display: 'flex' }}>
      <LiveKitRoom
        key={`${server.id}-${server.sfuId ?? 'default'}`}
        token={livekitToken!}
        serverUrl={serverUrl}
        connect
        video={false}
        audio
        options={{
          adaptiveStream: false,
          dynacast: false,
          publishDefaults: {
            videoCodec: 'av1',
            videoEncoding: encoding1080p30_3m,
            screenShareEncoding: encoding1080p30_3m,
            audioPreset: AudioPresets.speech,
            dtx: true,
            red: false,
          },
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }}
        style={{ display: 'flex', flexGrow: 1, minWidth: 0, position: 'relative' }}
      >
        <RoomConnectionWatcher onChange={setConnected} />
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

      {showOverlay && (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            {transition.text ?? 'Загрузка...'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}; 