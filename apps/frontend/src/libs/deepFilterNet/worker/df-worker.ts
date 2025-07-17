import { loadDeepFilterModel } from '../modelLoader';
import { SabRing } from './df-sab';

interface InitMsg {
  sabIn: SharedArrayBuffer;
  sabOut: SharedArrayBuffer;
  frameLen: number;
  modelName: string;
  attenLim: number;
  postFilterBeta: number;
}

let inRing: SabRing;
let outRing: SabRing;
let frameLen = 480;
let running = false;
let wasm: any;
let dfState: any;
let frameCounter = 0;
let lastLog = Date.now();
let underflows = 0;

self.onmessage = async (e: MessageEvent<InitMsg | { type: 'dispose' }>) => {
  const data: any = e.data;
  if ((data as any).type === 'dispose') {
    running = false;
    close();
    return;
  }
  const init = data as InitMsg;
  frameLen = init.frameLen;
  inRing = SabRing.fromExisting(init.sabIn, frameLen);
  outRing = SabRing.fromExisting(init.sabOut, frameLen);

  // load wasm + model
  const [dfJsCode, wasmBytes, modelBytes] = await Promise.all([
    fetch('/wasm/df.js').then(r=>r.text()),
    fetch('/wasm/df_bg.wasm').then(r=>r.arrayBuffer()).then(b=>new Uint8Array(b)),
    loadDeepFilterModel(init.modelName)
  ]);
  // eslint-disable-next-line no-eval
  (0, eval)(`${dfJsCode}\nglobalThis.wasm_bindgen = wasm_bindgen;`);
  await (globalThis as any).wasm_bindgen(wasmBytes);
  wasm = (globalThis as any).wasm_bindgen;
  dfState = wasm.df_create(modelBytes, init.attenLim);
  wasm.df_set_post_filter_beta(dfState, init.postFilterBeta);
  running = true;
  loop();
};

function loop() {
  if (!running) return;
  const buf = new Float32Array(frameLen);
  if (inRing.pop(buf)) {
    const processed = wasm.df_process_frame(dfState, buf) as Float32Array;
    // Wait until there is space in the outRing to avoid dropping frames
    if (!outRing.push(processed)) {
      // back-off: wait couple of ms for consumer to catch up
      const start = performance.now();
      while (!outRing.push(processed)) {
        if (performance.now() - start > 20) {
          console.warn('[DF-Worker] dropping frame, ring still full');
          break;
        }
      }
    }

    frameCounter++;
    if (frameCounter % 100 === 0) {
      const now = Date.now();
      console.log('[DF-Worker] processed', frameCounter, 'frames in', now - lastLog, 'ms', 'inRing', inRing.size(), 'outRing', outRing.size());
      lastLog = now;
    }
  } else {
    underflows++;
    if (underflows % 100 === 0) {
      console.warn('[DF-Worker] inRing underflow', underflows, 'outRing size', outRing.size());
    }
    inRing.waitForData();
  }
  setTimeout(loop, 0);
} 