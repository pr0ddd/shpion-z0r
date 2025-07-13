import { useEffect, useRef } from 'react';
import {
  AudioProcessorOptions,
  createLocalAudioTrack,
  LocalAudioTrack,
  Track,
  TrackProcessor,
} from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

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
        echoCancellation: !processorEnabled,
        noiseSuppression: !processorEnabled,
        autoGainControl: !processorEnabled,
        voiceIsolation: !processorEnabled,
      });

      const audioContext = new AudioContext();
      processorRef.current = processor;

      track.setAudioContext(audioContext);

      if (cancelled) {
        // track.stop();
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
      cancelled = true;
      if (micTrackRef.current) {
        try {
          room.localParticipant.unpublishTrack(micTrackRef.current);
        } catch {}
        micTrackRef.current.stop();
        micTrackRef.current = null;
      }
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
