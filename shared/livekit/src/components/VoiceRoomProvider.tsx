import React, { PropsWithChildren, useMemo } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { useLiveKitToken } from '@shared/hooks';

export interface VoiceRoomProviderProps {
  serverId: string | null;
  // Allow passing extra LiveKitRoom props via rest operator if needed in future
}

export const VoiceRoomProvider: React.FC<PropsWithChildren<VoiceRoomProviderProps>> = ({
  serverId,
  children,
}) => {
  const { token, isLoading, error } = useLiveKitToken(serverId);

  const url = useMemo(() => {
    if (!serverId) return null;
    // base url could be environment var; cast to any to avoid typing issues in non-Vite build
    const host = (import.meta as any).env?.VITE_VOICE_SERVER_URL ?? 'wss://voice.example.com';
    return `${host}`;
  }, [serverId]);

  if (isLoading || !token || !url) return null;
  if (error) {
    console.error(error);
    return null;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect={true}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </LiveKitRoom>
  );
}; 