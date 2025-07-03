import { LiveKitRoom as LiveKitRoomBase } from '@livekit/components-react';
import { useLiveKitTokenQuery } from '@entities/server/api';
import { useState } from 'react';
import { LiveKitRoomLoading } from './LiveKitRoomLoading';
import { LiveKitRoomConsumer } from './LiveKitRoomConsumer';
import { STREAM_PRESETS } from '@config/streaming';

interface LiveKitRoomProps {
  serverId: string;
  isLoadingServer: boolean;
  sfuId: string;
  sfuUrl: string;
  children: React.ReactNode;
}

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({
  serverId,
  isLoadingServer,
  sfuId,
  sfuUrl,
  children,
}) => {
  const { data: livekitToken, isLoading: isLoadingLiveKitToken } =
    useLiveKitTokenQuery(serverId);

  const [isConnected, setIsConnected] = useState(false);

  if (isLoadingServer || isLoadingLiveKitToken) {
    return <LiveKitRoomLoading />;
  }

  return (
    <LiveKitRoomBase
      style={{
        display: 'flex',
        flexGrow: 1,
      }}
      key={`shpion-${serverId}-${sfuId}`}
      token={livekitToken!}
      serverUrl={sfuUrl}
      connect
      video={false}
      audio
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: STREAM_PRESETS['balanced'],
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          voiceIsolation: true,
        },
      }}
    >
      <LiveKitRoomConsumer onStatusChange={setIsConnected} />
      {isConnected ? children : <LiveKitRoomLoading />}
    </LiveKitRoomBase>
  );
};
