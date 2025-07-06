import { useRoomContext } from '@livekit/components-react';
import {
  AudioProcessorOptions,
  createLocalAudioTrack,
  LocalAudioTrack,
  Track,
  TrackProcessor,
} from 'livekit-client';
import { useEffect, useRef } from 'react';

interface LivekitVirtualMicProps {
  processorEnabled: boolean;
}

export const LivekitVirtualMic: React.FC<LivekitVirtualMicProps> = ({
  processorEnabled,
}) => {
  const room = useRoomContext();
  // const processor = createDeepFilterProcessor();
  const micTrackRef = useRef<LocalAudioTrack | null>(null);
  const processorRef = useRef<TrackProcessor<
    Track.Kind.Audio,
    AudioProcessorOptions
  > | null>(null);
  const processor = processorRef.current;

  useEffect(() => {
    if (!room) return;

    let cancelled = false;

    const init = async () => {
      if (micTrackRef.current || cancelled) return;

      const track = await createLocalAudioTrack({
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      });

      const audioContext = new AudioContext();
      processorRef.current = processor;

      track.setAudioContext(audioContext);

      if (cancelled) {
        track.stop();
        return;
      }

      if (processorEnabled && processor) {
        await track.setProcessor(processor);
      }

      await room.localParticipant.publishTrack(track);
      micTrackRef.current = track;
    };

    init();

    return () => {
      const cleanup = async () => {
        cancelled = true;
        if (micTrackRef.current) {
          try {
            await room.localParticipant.unpublishTrack(micTrackRef.current);
          } catch {}
          micTrackRef.current.stop();
          micTrackRef.current = null;
        }
      };

      cleanup();
    };
  }, [room]);

  useEffect(() => {
    const updateProcessor = async () => {
      const track: LocalAudioTrack | null = micTrackRef.current;
      if (!track) return;

      if (processorEnabled && processor) {
        await track.setProcessor(processor);
      } else {
        await track.stopProcessor();
      }
    };

    updateProcessor();
  }, [processorEnabled, processor]);

  return null;
};
