import type {
  TrackProcessor,
  AudioProcessorOptions,
  Track,
} from 'livekit-client';
import { loadDeepFilterModel } from './modelLoader';
import { CompressorOptions, DeepFilterOptions } from '@entities/systemSettings';

export interface DeepFilterNetSettings {
  attenLim?: number;
  postFilterBeta?: number;
  modelName?: string;
}

export const getDeepFilterNetFiles = async (): Promise<
  [string, Uint8Array, Uint8Array]
> => {
  return Promise.all([
    fetch('/wasm/df.js').then((r) => r.text()),
    fetch('/wasm/df_bg.wasm')
      .then((r) => r.arrayBuffer())
      .then((buf) => new Uint8Array(buf)),
    loadDeepFilterModel('DeepFilterNet3_ll'),
  ]);
};


/**
 * @deprecated
 */
export const createDeepFilterProcessor = ({
  dfJsCode,
  wasmBytes,
  modelBytes,
}: {
  dfJsCode: string;
  wasmBytes: Uint8Array;
  modelBytes: Uint8Array;
}): TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> => {
  let node: AudioWorkletNode | null = null;
  let srcNode: MediaStreamAudioSourceNode | null = null;
  let dstNode: MediaStreamAudioDestinationNode | null = null;

  const processor: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
    name: 'deepfilter-net',
    init: async ({ track, audioContext }) => {
      // 1. Make sure AudioContext is running (autoplay policies)
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (_) {
          /* swallow */
        }
      }

      // TODO: review processor !!!
      await audioContext.audioWorklet.addModule(`/deepfilter-processor.js?v=${Date.now()}`);
      node = new AudioWorkletNode(audioContext, 'deepfilter-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        processorOptions: {
          test: 'test',
          attenLim: 90,
          postFilterBeta: 0.05,
          modelBytes: modelBytes,
          dfJsCode: dfJsCode,
          wasmBytes: wasmBytes,
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
    restart: async (opts) => {
      // попросим worklet освободить память перед перезапуском
      try {
        node?.port.postMessage({ type: 'dispose' });
      } catch {}
      // небольшая задержка, чтобы сообщение успело дойти, но не блокируем UI
      // TODO: handle confirm from the worklet !!!
      await new Promise((r) => setTimeout(r, 0));
      if (srcNode) {
        try {
          srcNode.disconnect();
        } catch {}
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
          dstNode.stream.getTracks().forEach((t) => t.stop());
        } catch {}
        dstNode = null;
      }
      // re-init with the new track/audioContext
      await processor.init(opts);
    },
    destroy: async () => {
      try {
        node?.port.postMessage({ type: 'dispose' });
      } catch {}
      await new Promise((r) => setTimeout(r, 0));
      if (srcNode) {
        try {
          srcNode.disconnect();
        } catch {}
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
          dstNode.stream.getTracks().forEach((t) => t.stop());
        } catch {}
        dstNode = null;
      }
      processor.processedTrack = undefined;
    },
  };

  return processor;
};

export const createDeepFilterProcessorSAB = async (
  audioContext: AudioContext,
  deepFilterOptions: DeepFilterOptions,
  compressorOptions: CompressorOptions
): Promise<TrackProcessor<Track.Kind.Audio, AudioProcessorOptions>> => {
  // Используем блок 480 сэмплов для модели; worklet отдаёт точно 480 после FIR ресэмплера 16→15
  const frameLen = 480;
  const capacity = deepFilterOptions.sabRingCapacity;  // ≈320 ms буфер для стартовой стабилизации
  const { SabRing } = await import('./worker/df-sab');
  const sabIn = new SabRing(frameLen, capacity).sab;
  const sabOut = new SabRing(frameLen, capacity).sab;
  // start worker
  const worker = new Worker(new URL('./worker/df-worker.ts', import.meta.url), { type: 'module' });
  worker.postMessage({
    sabIn,
    sabOut,
    frameLen,
    modelName: 'DeepFilterNet3_ll',
    attenLim: deepFilterOptions.attenLim,
    postFilterBeta: deepFilterOptions.postFilterBeta,
  });
  // Live logs removed per user request
  await audioContext.audioWorklet.addModule(`/deepfilter-sab-processor.js?v=${Date.now()}`);
  const node = new AudioWorkletNode(audioContext, 'deepfilter-sab', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1, // keep mono inside processor
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    processorOptions: { sabIn, sabOut, frameLen }
  });

  // Output gain applied AFTER noise suppression
  // ----- Dynamics Compressor -----
  // Apply dynamic range compression after noise suppression to make
  // quiet sounds louder and loud sounds softer for more consistent
  // perceived volume. Parameters come from system settings.
  const compressorNode = audioContext.createDynamicsCompressor();
  compressorNode.threshold.value = compressorOptions.threshold;
  compressorNode.knee.value = compressorOptions.knee;
  compressorNode.ratio.value = compressorOptions.ratio;
  compressorNode.attack.value = compressorOptions.attack;
  compressorNode.release.value = compressorOptions.release;

  // ----- Output gain -----
  const gainNode = audioContext.createGain();
  gainNode.gain.value = deepFilterOptions.outputGain;

  // Upmix mono -> stereo so that downstream MediaStreamTrack has 2 channels
  const merger = audioContext.createChannelMerger(2);
  node.connect(compressorNode);
  compressorNode.connect(gainNode);
  gainNode.connect(merger, 0, 0);
  gainNode.connect(merger, 0, 1);

  let srcNode: MediaStreamAudioSourceNode | null = null;
  let dstNode: MediaStreamAudioDestinationNode | null = null;
  const proc: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
    name: 'deepfilter-sab',
    init: async ({ track, audioContext }) => {
      srcNode = audioContext.createMediaStreamSource(new MediaStream([track]));
      dstNode = audioContext.createMediaStreamDestination();

      srcNode.connect(node);
      merger.connect(dstNode);

      // log removed
      proc.processedTrack = dstNode.stream.getAudioTracks()[0];
    },
    restart: async (opts) => {},
    destroy: async () => {
      worker.postMessage({ type: 'dispose' });
      srcNode?.disconnect();
      // disconnect nodes
      node.disconnect();
      compressorNode.disconnect();
      gainNode.disconnect();
      dstNode?.disconnect();
      // Live logs removed per user request
    }
  };
  return proc;
};
