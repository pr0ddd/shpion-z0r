import { LiveKitRoom as LiveKitRoomBase } from '@livekit/components-react';
import { useEffect, useState } from 'react';

import { useServerStore } from '@entities/server/model';

import { useLiveKitTokenQuery } from '../../model/liveKitToken.query';

import { LiveKitRoomLoading } from '../atoms/LiveKitRoomLoading';
import { LivekitVirtualMic } from '../organisms/LivekitVirtualMic';
import { LiveKitRoomAudioRenderer } from '../organisms/LiveKitRoomAudioRenderer';
import { SpeakingSync } from '../organisms/SpeakingSync';
import { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';
import { createDeepFilterProcessorSAB } from '@libs/deepFilterNet/createDeepFilterProcessor';
import { createGlobalAudioContext } from '@libs/audioContext';
import { useSystemSettingsStore } from '@entities/systemSettings';

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
  const roomOptions = useSystemSettingsStore((s) => s.roomOptions)!;
  const deepFilterOptions = useSystemSettingsStore((s) => s.deepFilterOptions)!;
  const compressorOptions = useSystemSettingsStore((s) => s.compressorOptions)!;
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
    const processor = await createDeepFilterProcessorSAB(
      createGlobalAudioContext(),
      deepFilterOptions,
      compressorOptions
    );
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
        ...roomOptions,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720
          },
        },
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
      <SpeakingSync />
      {isProcessorReady && !!processor && audioContext && (
        <LivekitVirtualMic
          processor={processor}
          processorEnabled={isProcessorEnabled}
          audioContext={audioContext}
        />
      )}

      {children}
      {!isConnected && <LiveKitRoomLoading />}
    </LiveKitRoomBase>
  );
};
