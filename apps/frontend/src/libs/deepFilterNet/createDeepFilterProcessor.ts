import type { TrackProcessor, AudioProcessorOptions, Track } from 'livekit-client';
import { loadDeepFilterModel } from './modelLoader';

export interface DeepFilterNetSettings {
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
  { attenLim = 100, postFilterBeta = 0.05, modelName = 'DeepFilterNet3' }: DeepFilterNetSettings = {},
): TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> => {
  // keep local reference to the worklet node so that we can tear it down later
  let node: AudioWorkletNode | null = null;

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
      const start = performance.now();
      await audioContext.audioWorklet.addModule('/deepfilter-processor.js')

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
      const src = audioContext.createMediaStreamSource(new MediaStream([track]));
      const dst = audioContext.createMediaStreamDestination();
      src.connect(node);
      node.connect(dst);

      // expose to LiveKit – it will replace the original track
      processor.processedTrack = dst.stream.getAudioTracks()[0];

      const end = performance.now();
      console.log('🎤 DeepFilterProcessor: Загрузка worklet', end - start);
    },

    // When LiveKit restarts capture (e.g., device switch), we recreate the chain
    restart: async (opts) => {
      if (node) {
        try {
          node.disconnect();
        } catch {}
        node = null;
      }
      // re-init with the new track/audioContext
      await processor.init(opts);
    },

    // Cleanup when track is unpublished or room left
    destroy: async () => {
      if (node) {
        try {
          node.disconnect();
          node.port.close();
        } catch {
          /* noop */
        }
        node = null;
      }
      processor.processedTrack = undefined;
    },
  };

  return processor;
}; 