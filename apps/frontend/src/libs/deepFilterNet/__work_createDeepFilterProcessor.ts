import type { TrackProcessor, AudioProcessorOptions, Track } from 'livekit-client';
import { loadDeepFilterModel } from './modelLoader';

interface Settings {
  attenLim?: number;
  postFilterBeta?: number;
  modelName?: string; // DeepFilterNet3, DeepFilterNet2, ...
}

/**
 * Factory returning a TrackProcessor descriptor understood by LiveKit JS SDK.
 * The processor loads the DeepFilterNet WASM + model inside `init()` and wires
 * the MediaStreamTrack through an AudioWorkletNode.
 *
 * It intentionally performs *all* heavy loading work lazily in `init` so that
 * the descriptor itself can be structured-cloned when passed through
 * `AudioCaptureOptions.processor`.
 */
export const createDeepFilterProcessor = (
  { attenLim = 100, postFilterBeta = 0.05, modelName = 'DeepFilterNet3' }: Settings = {},
): TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> => {
  // keep local reference to the worklet node so that we can tear it down later
  let node: AudioWorkletNode | null = null;
  let srcNode: MediaStreamAudioSourceNode | null = null;
  let dstNode: MediaStreamAudioDestinationNode | null = null;

  // The descriptor object – LiveKit will call the lifecycle hooks.
  const processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
    name: 'deepfilter-net',

    /**
     * LiveKit calls init() once right after creating the local track.
     * We get the raw MediaStreamTrack and an (already running) AudioContext.
     */
    init: async ({ track, audioContext }) => {
      // 1. Make sure AudioContext is running (autoplay policies)
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (_) {
          /* swallow */
        }
      }

      // 2. Load the DeepFilter worklet script
      await audioContext.audioWorklet.addModule('/deepfilter-processor.js');

      // 3. Fetch helper glue + wasm + model bytes (in parallel)
      const [dfJsCode, wasmBytes, modelBytes] = await Promise.all([
        fetch('/wasm/df.js').then((r) => r.text()),
        fetch('/wasm/df_bg.wasm').then((r) => r.arrayBuffer()).then((buf) => new Uint8Array(buf)),
        loadDeepFilterModel(modelName),
      ]);

      // 4. Create the AudioWorkletNode with processorOptions
      node = new AudioWorkletNode(audioContext, 'deepfilter-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        processorOptions: {
          attenLim,
          postFilterBeta,
          modelBytes,
          dfJsCode,
          wasmBytes,
        },
      });

      // 5. Build the graph track -> node -> destination -> processedTrack
      srcNode = audioContext.createMediaStreamSource(new MediaStream([track]));
      dstNode = audioContext.createMediaStreamDestination();
      srcNode.connect(node);
      node.connect(dstNode);

      // expose to LiveKit – it will replace the original track
      processor.processedTrack = dstNode.stream.getAudioTracks()[0];
    },

    // When LiveKit restarts capture (e.g., device switch), we recreate the chain
    restart: async (opts) => {
      // попросим worklet освободить память перед перезапуском
      try { node?.port.postMessage({ type: 'dispose' }); } catch {}
      // небольшая задержка, чтобы сообщение успело дойти, но не блокируем UI
      await new Promise(r => setTimeout(r, 0));
      if (srcNode) {
        try { srcNode.disconnect(); } catch {}
        srcNode = null;
      }
      if (node) {
        try {
          node.disconnect();
          node.port.close();
        } catch {}
        node = null;
      }
      if (dstNode) {
        try {
          dstNode.disconnect();
          dstNode.stream.getTracks().forEach(t => t.stop());
        } catch {}
        dstNode = null;
      }
      // re-init with the new track/audioContext
      await processor.init(opts);
    },

    // Cleanup when track is unpublished or room left
    destroy: async () => {
      try { node?.port.postMessage({ type: 'dispose' }); } catch {}
      await new Promise(r=>setTimeout(r,0));
      if (srcNode) {
        try { srcNode.disconnect(); } catch {}
        srcNode = null;
      }
      if (node) {
        try {
          node.disconnect();
          node.port.close();
        } catch {}
        node = null;
      }
      if (dstNode) {
        try {
          dstNode.disconnect();
          dstNode.stream.getTracks().forEach(t => t.stop());
        } catch {}
        dstNode = null;
      }
      processor.processedTrack = undefined;
    },
  };

  return processor;
}; 