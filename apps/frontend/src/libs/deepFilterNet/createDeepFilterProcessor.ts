import type {
  TrackProcessor,
  AudioProcessorOptions,
  Track,
} from 'livekit-client';
import { loadDeepFilterModel } from './modelLoader';

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
