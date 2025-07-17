import type {
  TrackProcessor,
  AudioProcessorOptions,
  Track,
} from 'livekit-client';
import { loadDeepFilterModel } from './modelLoader';
import { DEEPFILTER_ATTEN_LIM, DEEPFILTER_POSTFILTER_BETA } from '@configs/deepFilter';

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
      await audioContext.audioWorklet.addModule('/deepfilter-processor.js');
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

export const createDeepFilterProcessorSAB = async (audioContext: AudioContext): Promise<TrackProcessor<Track.Kind.Audio, AudioProcessorOptions>> => {
  const frameLen = 480; // DeepFilterNet3 expects 480-sample frames at 48 kHz
  const capacity = 32;  // ≈320 ms буфер для стартовой стабилизации
  const { SabRing } = await import('./worker/df-sab');
  const sabIn = new SabRing(frameLen, capacity).sab;
  const sabOut = new SabRing(frameLen, capacity).sab;
  // start worker
  const worker = new Worker(new URL('./worker/df-worker.ts', import.meta.url), { type: 'module' });
  worker.postMessage({ sabIn, sabOut, frameLen, modelName: 'DeepFilterNet3', attenLim: DEEPFILTER_ATTEN_LIM, postFilterBeta: DEEPFILTER_POSTFILTER_BETA });
  await audioContext.audioWorklet.addModule('/deepfilter-sab-processor.js');
  const node = new AudioWorkletNode(audioContext, 'deepfilter-sab', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1, // keep mono inside processor
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    processorOptions: { sabIn, sabOut, frameLen }
  });

  console.log('[DF] Worklet node created', {
    channelCount: node.channelCount,
    numberOfOutputs: node.numberOfOutputs,
    channelCountMode: node.channelCountMode,
    frameLen,
  });

  // Dynamics compressor to equalize input levels
  const comp = audioContext.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.knee.value = 30;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;

  // Upmix mono -> stereo so that downstream MediaStreamTrack has 2 channels
  const merger = audioContext.createChannelMerger(2);
  node.connect(merger, 0, 0);
  node.connect(merger, 0, 1);

  let srcNode: MediaStreamAudioSourceNode | null = null;
  let dstNode: MediaStreamAudioDestinationNode | null = null;
  const proc: TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> = {
    name: 'deepfilter-sab',
    init: async ({ track, audioContext }) => {
      srcNode = audioContext.createMediaStreamSource(new MediaStream([track]));
      dstNode = audioContext.createMediaStreamDestination();

      srcNode.connect(comp);
      comp.connect(node);
      merger.connect(dstNode);

      console.log('[DF] dstNode stream track settings', dstNode.stream.getAudioTracks()[0].getSettings?.());
      proc.processedTrack = dstNode.stream.getAudioTracks()[0];
    },
    restart: async (opts) => {},
    destroy: async () => {
      worker.postMessage({ type: 'dispose' });
      srcNode?.disconnect();
      comp.disconnect();
      node.disconnect();
      dstNode?.disconnect();
    }
  };
  return proc;
};
