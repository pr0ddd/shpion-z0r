import { modelLoader } from './modelLoader';

/**
 * Downloads and caches all assets required by DeepFilterNet noise-suppression pipeline.
 * Currently this is the WASM binary (df_bg.wasm) and the neural-network model archive
 * (DeepFilterNet3_ll_onnx.tar.gz). The function resolves once both files are fully
 * fetched and stored in browser cache/memory.
 *
 * An optional callback can be provided to track download progress. It will be called
 * with two arguments: `bytesLoaded` and `bytesTotal`. For unknown total sizes the
 * second argument will be 0.
 */
export async function loadDeepFilterAssets(
  onProgress?: (bytesLoaded: number, bytesTotal: number) => void,
): Promise<void> {
  // 1. Start loading WASM module
  const wasmPromise = (async () => {
    const resp = await fetch('/wasm/df_bg.wasm');
    if (!resp.ok) {
      throw new Error(`Failed to fetch df_bg.wasm – HTTP ${resp.status}`);
    }

    const total = Number(resp.headers.get('content-length') ?? 0);

    // If the stream API is unavailable or we do not care about progress – simple path
    if (!resp.body || typeof resp.body.getReader !== 'function') {
      // Drain body to cache
      await resp.arrayBuffer();
      if (onProgress) onProgress(total, total);
      return;
    }

    const reader = resp.body.getReader();
    let loaded = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        loaded += value.length;
        if (onProgress) onProgress(loaded, total);
      }
    }
  })();

  // 2. Start loading NN model (re-uses existing modelLoader logic)
  const modelPromise = modelLoader.loadModel('DeepFilterNet3_ll');

  // 3. Wait for both downloads to finish
  await Promise.all([wasmPromise, modelPromise]);
} 