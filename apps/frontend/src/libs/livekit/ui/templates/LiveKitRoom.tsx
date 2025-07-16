import { LiveKitRoom as LiveKitRoomBase } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { STREAM_PRESETS, AUDIO_CAPTURE_DEFAULTS } from '@configs';

import { useServerStore } from '@entities/server/model';

import { useLiveKitTokenQuery } from '../../model/liveKitToken.query';

import { LiveKitRoomLoading } from '../atoms/LiveKitRoomLoading';
import { LivekitVirtualMic } from '../organisms/LivekitVirtualMic';
import { LiveKitRoomAudioRenderer } from '../organisms/LiveKitRoomAudioRenderer';
import { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';
import { createDeepFilterProcessor, getDeepFilterNetFiles } from '@libs/deepFilterNet/createDeepFilterProcessor';
import { createGlobalAudioContext } from '@libs/audioContext';

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
  const isConnected = useServerStore((s) => s.isConnected);
  const setIsConnected = useServerStore((s) => s.setIsConnected);
  const { data: livekitToken, isLoading: isLoadingLiveKitToken } =
    useLiveKitTokenQuery(serverId);
  const [isReady, setIsReady] = useState(false);
  const [processor, setProcessor] = useState<TrackProcessor<
    Track.Kind.Audio,
    AudioProcessorOptions
  > | null>(null);
  const [isProcessorReady, setIsProcessorReady] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const isProcessorEnabled = true;

  useEffect(() => {
    const startButton = document.getElementById('start-button');
    if (startButton) {
      setTimeout(() => {
        startButton.click();
        initDeppFilterProcessor();
      }, 1000);
    }
  }, []);

  const initDeppFilterProcessor = async () => {
    const [dfJsCode, wasmBytes, modelBytes] = await getDeepFilterNetFiles();
    const processor = createDeepFilterProcessor({
      dfJsCode,
      wasmBytes,
      modelBytes,
    });
    setProcessor(processor);
    setIsProcessorReady(true);

    // Create the global AudioContext strictly after processor is ready
    const ac = createGlobalAudioContext();
    setAudioContext(ac);
  };

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
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
      }}
      key={`shpion-${serverId}-${sfuId}`}
      token={livekitToken!}
      serverUrl={sfuUrl}
      connect={isReady}
      audio={false}
      options={{
        adaptiveStream: false,
        dynacast: false,
        publishDefaults: STREAM_PRESETS['balanced'],
        audioCaptureDefaults: AUDIO_CAPTURE_DEFAULTS,
      }}
      onConnected={() => setIsConnected(true)}
      onDisconnected={() => setIsConnected(false)}
      onError={(error) => {
        console.log('error', error);
      }}
    >
      {/* NOTE: RoomAudioRenderer is LiveKit pre-built component for audio rendering */}
      {/* <RoomAudioRenderer /> */}
      <LiveKitRoomAudioRenderer />
      {isProcessorReady && !!processor && audioContext && (
        <LivekitVirtualMic
          processor={processor}
          processorEnabled={isProcessorEnabled}
          audioContext={audioContext}
        />
      )}

      {isConnected ? children : <LiveKitRoomLoading />}
    </LiveKitRoomBase>
  );
};
