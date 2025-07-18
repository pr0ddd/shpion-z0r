/*
  Global singleton AudioContext with fixed sample rate (48kHz).
  NOTE: The context MUST be created only **after** the DeepFilterNet processor
  is initialised.  Use `createGlobalAudioContext()` from the place where the
  processor is ready (e.g. LiveKitRoom) and use `waitForGlobalAudioContext()`
  everywhere else.
*/

// Added visibility change debug log
document.addEventListener('visibilitychange', () =>
  console.log('visibility', document.visibilityState));

let globalAudioContext: AudioContext | null = null;
let ctxReadyPromise: Promise<AudioContext> | null = null;
let ctxReadyResolver: ((ctx: AudioContext) => void) | null = null;

/**
 * Creates (or returns existing) global `AudioContext` with sampleRate = 48kHz.
 * MUST be called only once and strictly **after** DeepFilterNet init.
 */
export const createGlobalAudioContext = (): AudioContext => {
  if (!globalAudioContext) {
    // Use 48 kHz everywhere to avoid implicit resampling and quality loss
    globalAudioContext = new AudioContext({ sampleRate: 48_000 });
    // Periodically log current sample rate
    setInterval(() => console.log('ctx rate', globalAudioContext!.sampleRate), 500);
    if (ctxReadyResolver) {
      ctxReadyResolver(globalAudioContext);
      ctxReadyResolver = null;
    }
  }
  return globalAudioContext;
};

/**
 * Returns the global context synchronously if it already exists.
 */
export const getGlobalAudioContext = (): AudioContext | null => {
  return globalAudioContext;
};

/**
 * Waits until the global `AudioContext` is available.
 */
export const waitForGlobalAudioContext = (): Promise<AudioContext> => {
  if (globalAudioContext) return Promise.resolve(globalAudioContext);
  if (!ctxReadyPromise) {
    ctxReadyPromise = new Promise<AudioContext>((resolve) => {
      ctxReadyResolver = resolve;
    });
  }
  return ctxReadyPromise;
}; 