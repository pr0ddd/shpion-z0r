import React, { PropsWithChildren, useMemo } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { Room } from 'livekit-client';
import '@livekit/components-styles';
import { useLiveKitToken } from '@shared/livekit';

interface LiveKitProviderProps {
  serverId: string | null;
}

export const LiveKitProvider: React.FC<PropsWithChildren<LiveKitProviderProps>> = ({
  serverId,
  children,
}) => {
  const { token, isLoading, error } = useLiveKitToken(serverId);

  const url = useMemo(() => {
    if (!serverId) return null;
    return (import.meta as any).env.VITE_LIVEKIT_URL as string;
  }, [serverId]);

  // memoize Room instance so that it survives re-renders
  const room = useMemo(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }), []);

  if (!serverId || isLoading || !token || !url) return null;
  if (error) {
    console.error(error);
    return null;
  }

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      room={room}
      connect
      style={{ width: '100%', height: '100%' }}
      data-lk-theme="default"
    >
      {children}
    </LiveKitRoom>
  );
}; 