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

  if (!inRing.pop(buf)) {
    // Нет новых данных – ждём уведомление от producer (AudioWorklet)
    inRing.waitForData(); // Atomics.wait ≤5 мс
    queueMicrotask(loop);
    return;
  }

  const processed = wasm.df_process_frame(dfState, buf) as Float32Array;

  // Если выходной буфер полон, подождём, чтобы не терять кадры
  if (!outRing.push(processed)) {
    // ждём, пока consumer освободит место (tail изменится)
    const ctrl: Int32Array = (outRing as any).ctrl;
    if (ctrl) {
      Atomics.wait(ctrl, 1, Atomics.load(ctrl, 1), 4); // max 4 мс ожидания
    }
    // второй попытки достаточно; если всё ещё full — дропаем кадр
    if (!outRing.push(processed)) {
      console.warn('[DF-Worker] dropping frame, ring still full');
    }
  }

  frameCounter++;
  if (frameCounter % 100 === 0) {
    const now = Date.now();
    console.log('[DF-Worker] processed', frameCounter, 'frames in', now - lastLog, 'ms', 'inRing', inRing.size(), 'outRing', outRing.size());
    lastLog = now;
  }

  // Планируем следующую итерацию сразу, чтобы держаться в real-time
  queueMicrotask(loop);
} 