import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * Resolved against this file rather than the working directory: a workspace
 * script can be run from the repository root or from here, and `process.cwd()`
 * is a different answer in each.
 */
const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': src },
  },
  /*
   * The engine is a workspace package consumed as source, not as a build. It
   * must not be pre-bundled: Vite's dependency optimiser would hand us a
   * CommonJS-ish bundle with its CSS modules flattened, and edits to it would
   * stop hot-reloading.
   */
  optimizeDeps: { exclude: ['@inmore/engine'] },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
