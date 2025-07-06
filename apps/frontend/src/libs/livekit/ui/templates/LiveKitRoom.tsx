import { LiveKitRoom as LiveKitRoomBase } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { STREAM_PRESETS } from '@config/streaming';

import { useServerStore } from '@entities/server/model';

import { useLiveKitTokenQuery } from '../../model/liveKitToken.query';

import { LiveKitRoomLoading } from '../atoms/LiveKitRoomLoading';
import { LivekitVirtualMic } from '../organisms/LivekitVirtualMic';
import { LiveKitRoomAudioRenderer } from '../organisms/LiveKitRoomAudioRenderer';

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
  const { isConnected, setIsConnected } = useServerStore();
  const { data: livekitToken, isLoading: isLoadingLiveKitToken } =
    useLiveKitTokenQuery(serverId);
  const [isReady, setIsReady] = useState(false);
  const isProcessorEnabled = false;

  useEffect(() => {
    const startButton = document.getElementById('start-button');
    if (startButton) {
      setTimeout(() => {
        startButton.click();
      }, 1000);
    }
  }, []);

  if (isLoadingServer || isLoadingLiveKitToken || !isReady) {
    return (
      <>
        <button
          style={{ display: 'none' }}
          id="start-button"
          onClick={() => setIsReady(true)}
        >
          Start
        </button>
        <LiveKitRoomLoading />
      </>
    );
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
      connect={isReady}
      audio={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: STREAM_PRESETS['balanced'],
      }}
      onConnected={() => {
        setIsConnected(true);
      }}
      onDisconnected={() => {
        setIsConnected(false);
      }}
      onError={(error) => {
        console.log('error', error);
      }}
    >
      {/* NOTE: RoomAudioRenderer is LiveKit pre-built component for audio rendering */}
      {/* <RoomAudioRenderer /> */}
      <LiveKitRoomAudioRenderer />
      <LivekitVirtualMic processorEnabled={isProcessorEnabled} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexGrow: 1,
        }}
      >
        {isConnected ? children : <LiveKitRoomLoading />}
      </div>
    </LiveKitRoomBase>
  );
};
