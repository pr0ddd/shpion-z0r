/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  server: {
    port: 4200,
    host: 'localhost',
    compress: false,
    headers: {
      // для SharedArrayBuffer / AudioWorklet + Worker
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react']
  },
  optimizeDeps: {
    esbuildOptions: {
      logLevel: 'error',
    },
  },
  // Worker config – нужен для tsconfig-paths в WebWorker
  // @ts-ignore – Vite types mismatch for worker.plugins, but runtime is fine
  worker: {
    format: 'es',
    plugins: [nxViteTsPaths()],
  } as any,
  // Suppress noisy Rollup warnings like "Module level directives cause errors when bundled"
  build: {
    outDir: '../../dist/apps/frontend',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Skip "use client" directive noise
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
    // Reduce esbuild verbosity
    esbuild: {
      logLevel: 'error',
    },
  },
}));
