import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * Build `embed.js` — the only file a client's page downloads.
 *
 * A separate config from the frame's because it is a different kind of
 * artefact: an IIFE with no module loader, no imports at runtime, and a fixed
 * filename, since the whole point is that a client pastes one unchanging URL
 * into their template and never thinks about it again. A hashed filename would
 * make every deploy a change to their page.
 *
 * `emptyOutDir` is off so this can be built after the frame without deleting
 * it. The order in package.json is deliberate.
 */
export default defineConfig({
  build: {
    target: 'es2018',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(here, 'src/loader.js'),
      name: 'InmoreStudio',
      formats: ['iife'],
      fileName: () => 'embed.js',
    },
    rollupOptions: {
      output: {
        // The loader injects its own styles as a string; a separate CSS file
        // would be a second request for something measured in bytes.
        assetFileNames: 'embed.[ext]',
      },
    },
    minify: 'esbuild',
  },
});
