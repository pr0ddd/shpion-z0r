import { useEffect, useRef } from 'react';
import {
  AudioProcessorOptions,
  createLocalAudioTrack,
  LocalAudioTrack,
  Track,
  TrackProcessor,
} from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { useSystemSettingsStore } from '@entities/systemSettings';
interface LivekitVirtualMicProps {
  processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions>;
  processorEnabled: boolean;
  audioContext: AudioContext;
}

export const LivekitVirtualMic: React.FC<LivekitVirtualMicProps> = ({
  processor,
  processorEnabled,
  audioContext,
}) => {
  const room = useRoomContext();
  const audioCaptureDefaults = useSystemSettingsStore((s) => s.roomOptions!.audioCaptureDefaults);
  const micTrackRef = useRef<LocalAudioTrack | null>(null);
  const processorRef = useRef<TrackProcessor<
    Track.Kind.Audio,
    AudioProcessorOptions
  > | null>(null);

  useEffect(() => {
    if (!room) return;

    let cancelled = false;

    const init = async () => {
      if (micTrackRef.current || cancelled) return;

      const track = await createLocalAudioTrack(audioCaptureDefaults);

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
  }, [room, audioContext]);

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
