import React, { useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { LocalAudioTrack, RoomEvent } from 'livekit-client';
import { NoiseSuppressorWorklet_Name } from '@timephy/rnnoise-wasm';
// Vite will give us the URL to the bundled worklet script
// ?worker&url is important to get plain URL for audioWorklet.addModule
import NoiseSuppressorWorklet from '@timephy/rnnoise-wasm/NoiseSuppressorWorklet?worker&url';

/**
 * Publishes a microphone track processed by RNNoise to the current LiveKit room.
 * Assumes that the parent <LiveKitRoom audio={false} /> so there is no default mic track.
 */
export const RnnoisePublisher: React.FC = () => {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;
    let track: LocalAudioTrack | null = null;
    let ctx: AudioContext | null = null;

    const publish = async () => {
      try {
        // 1. capture raw mic stream
        const rawStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 2. set up AudioWorklet graph
        ctx = new AudioContext({ sampleRate: 48000 });
        await ctx.audioWorklet.addModule(NoiseSuppressorWorklet);
        const src = ctx.createMediaStreamSource(rawStream);
        const rnnoiseNode = new AudioWorkletNode(ctx, NoiseSuppressorWorklet_Name);
        src.connect(rnnoiseNode);
        const dest = ctx.createMediaStreamDestination();
        rnnoiseNode.connect(dest);

        const processedTrack = dest.stream.getAudioTracks()[0];
        track = new LocalAudioTrack(processedTrack);
        await room.localParticipant.publishTrack(track);
      } catch (err) {
        /* eslint-disable no-console */
        console.error('RNNoise publish error', err);
      }
    };

    // Wait until room is connected
    if (room.state === 'connected') {
      publish();
    } else {
      const handleConnected = () => publish();
      room.once(RoomEvent.Connected, handleConnected);
      return () => {
        room.off(RoomEvent.Connected, handleConnected);
      };
    }

    return () => {
      if (track) {
        room.localParticipant.unpublishTrack(track);
        track.stop();
      }
      if (ctx) {
        ctx.close();
      }
    };
  }, [room]);

  return null;
}; 