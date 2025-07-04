import {
  LiveKitRoom as LiveKitRoomBase,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useLiveKitTokenQuery } from '@entities/server/api';
import { useEffect, useState } from 'react';
import { LiveKitRoomLoading } from './LiveKitRoomLoading';
// import { LiveKitRoomConsumer } from './LiveKitRoomConsumer';
import { STREAM_PRESETS } from '@config/streaming';
// import { useDeepFilterProcessor } from '@libs/deepFilterNet/useDeepFilterProcessor';
import { LivekitVirtualMic } from './LivekitVirtualMic';
import { useServerStore } from '@entities/server/model';
import { LiveKitRoomAudioRenderer } from './LiveKitRoomAudioRenderer';

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
  const [isProcessorEnabled, setIsProcessorEnabled] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const startButton = document.getElementById('start-button');
    if (startButton) {
      setTimeout(() => {
        startButton.click();
      }, 1000);
    }
  }, []);

  // const audioCaptureDefaults = {
  //   echoCancellation: true,
  //   noiseSuppression: !processor,
  //   autoGainControl: true,
  //   processor: processor ?? undefined,
  // };

  if (
    isLoadingServer ||
    isLoadingLiveKitToken ||
    !isReady
  ) {
    return (
      <button id="start-button" onClick={() => setIsReady(true)}>
        Start
      </button>
    );
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
      connect={isReady}
      audio={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: STREAM_PRESETS['balanced'],
      }}
      onConnected={() => {
        console.log('connected !!!!!');
        setIsConnected(true);
      }}
      onDisconnected={() => {
        console.log('disconnected !!!!!');
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

      {/* <LiveKitRoomConsumer onStatusChange={setIsConnected} /> */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexGrow: 1,
        }}
      >
        <button
          style={{ fontSize: 20 }}
          onClick={() => setIsProcessorEnabled(!isProcessorEnabled)}
        >
          Toggle audio processor: {isProcessorEnabled ? 'ON' : 'OFF'}
        </button>
        {isConnected ? children : <LiveKitRoomLoading />}
      </div>
    </LiveKitRoomBase>
  );
};
