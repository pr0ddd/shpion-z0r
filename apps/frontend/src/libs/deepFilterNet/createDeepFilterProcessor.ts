import type {
  TrackProcessor,
  AudioProcessorOptions,
  Track,
} from 'livekit-client';

export interface DeepFilterNetSettings {
  attenLim?: number;
  postFilterBeta?: number;
  modelName?: string;
}

export const createDeepFilterProcessor = (): TrackProcessor<
  Track.Kind.Audio,
  AudioProcessorOptions
> => {
  let node: AudioWorkletNode | null = null;
  let dst: MediaStreamAudioDestinationNode | null = null;

  const processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
    name: 'deepfilter-net',
    init: async ({ track, audioContext }) => {
      await audioContext.audioWorklet.addModule('/my-processor.js');
      const src = audioContext.createMediaStreamSource(
        new MediaStream([track])
      );
      dst = audioContext.createMediaStreamDestination();

      const [dfJsCode, wasmBytes, modelBytes] = await Promise.all([
        fetch('/wasm/df.js').then((r) => r.text()),
        fetch('/wasm/df_bg.wasm')
          .then((r) => r.arrayBuffer())
          .then((buf) => new Uint8Array(buf)),
        fetch('/models/DeepFilterNet3_onnx.tar.gz')
          .then((r) => r.arrayBuffer())
          .then((buf) => new Uint8Array(buf)),
      ]);

      node = new AudioWorkletNode(audioContext, 'my-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        processorOptions: {
          test: 'test',
          attenLim: 100,
          postFilterBeta: 0.05,
          modelBytes: modelBytes,
          dfJsCode: dfJsCode,
          wasmBytes: wasmBytes,
        },
      });

      src.connect(node);
      node.connect(dst);

      processor.processedTrack = dst.stream.getAudioTracks()[0];
    },
    restart: async (opts) => {
      console.log('restart', opts);
      processor.destroy();
      await processor.init(opts);
    },
    destroy: async () => {
      console.log('destroy');
      node?.disconnect();
      node?.port.close();

      node = null;
      dst = null;
      processor.processedTrack = undefined;
    },
  };

  return processor;

  // // The descriptor object – LiveKit will call the lifecycle hooks.
  // const processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
  //   name: 'deepfilter-net',

  //   /**
  //    * LiveKit calls init() once right after creating the local track.
  //    * We get the raw MediaStreamTrack and an (already running) AudioContext.
  //    */
  //   init: async ({ track, audioContext }) => {
  //     // 1. Make sure AudioContext is running (autoplay policies)
  //     if (audioContext.state === 'suspended') {
  //       try {
  //         await audioContext.resume();
  //       } catch (_) {
  //         /* swallow */
  //       }
  //     }

  //     // 2. Load the DeepFilter worklet script
  //     const start = performance.now();
  //     await audioContext.audioWorklet.addModule('/deepfilter-processor.js')

  //     // 3. Fetch helper glue + wasm + model bytes (in parallel)
  //     const [dfJsCode, wasmBytes, modelBytes] = await Promise.all([
  //       fetch('/wasm/df.js').then((r) => r.text()),
  //       fetch('/wasm/df_bg.wasm').then((r) => r.arrayBuffer()).then((buf) => new Uint8Array(buf)),
  //       loadDeepFilterModel(modelName),
  //     ]);

  //     // 4. Create the AudioWorkletNode with processorOptions
  //     node = new AudioWorkletNode(audioContext, 'deepfilter-processor', {
  //       numberOfInputs: 1,
  //       numberOfOutputs: 1,
  //       channelCount: 1,
  //       channelCountMode: 'explicit',
  //       channelInterpretation: 'speakers',
  //       processorOptions: {
  //         attenLim,
  //         postFilterBeta,
  //         modelBytes,
  //         dfJsCode,
  //         wasmBytes,
  //       },
  //     });

  //     // 5. Build the graph track -> node -> destination -> processedTrack
  //     const src = audioContext.createMediaStreamSource(new MediaStream([track]));
  //     const dst = audioContext.createMediaStreamDestination();
  //     src.connect(node);
  //     node.connect(dst);

  //     // expose to LiveKit – it will replace the original track
  //     processor.processedTrack = dst.stream.getAudioTracks()[0];

  //     const end = performance.now();
  //     console.log('🎤 DeepFilterProcessor: Загрузка worklet', end - start);
  //   },

  //   // When LiveKit restarts capture (e.g., device switch), we recreate the chain
  //   restart: async (opts) => {
  //     if (node) {
  //       try {
  //         node.disconnect();
  //       } catch {}
  //       node = null;
  //     }
  //     // re-init with the new track/audioContext
  //     await processor.init(opts);
  //   },

  //   // Cleanup when track is unpublished or room left
  //   destroy: async () => {
  //     if (node) {
  //       try {
  //         node.disconnect();
  //         node.port.close();
  //       } catch {
  //         /* noop */
  //       }
  //       node = null;
  //     }
  //     processor.processedTrack = undefined;
  //   },
  // };

  // return processor;
};
