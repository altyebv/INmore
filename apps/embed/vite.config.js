import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = path.resolve(here, '../..');

/**
 * Serve and build the things a tenant's embed needs alongside the frame.
 *
 * Two directories that live outside this app but have to be reachable from
 * its origin:
 *
 * - `tenants/*.json`, which the frame fetches at runtime. They are shared
 *   data, not this app's, so they are copied rather than duplicated.
 * - the Draco decoder, which decompresses every product model. It belongs to
 *   neither app — it is the same wasm for every client — so it is taken from
 *   where it already lives rather than committed twice. When a third host
 *   appears it should move to a shared vendor directory; until then, copying
 *   beats a second copy in git.
 */
function externalAssets() {
  const sources = [
    { from: path.join(root, 'tenants'), to: 'tenants', filter: (f) => f.endsWith('.json') },
    { from: path.join(root, 'apps/site/public/draco'), to: 'draco', filter: () => true },
    /*
     * The tenant's own models.
     *
     * Here because this deployment serves them itself, which is what an empty
     * assetBase in the config means. A tenant on a CDN sets assetBase to their
     * prefix instead and this copy does nothing — which is the point of the
     * setting: where a client's assets live is a deployment decision, not
     * something the engine or this build has an opinion about.
     */
    { from: path.join(root, 'apps/site/public/models'), to: 'models', filter: (f) => f.endsWith('.glb') },
  ];

  const copyInto = (outDir) => {
    // The demo host page is copied rather than built: it loads embed.js the way
    // a client would — a plain script tag, not a module — and Vite would try to
    // resolve that at build time and fail. Copying keeps it honest about what
    // a real snippet looks like.
    const demo = path.join(here, 'demo.html');
    if (fs.existsSync(demo)) fs.copyFileSync(demo, path.join(outDir, 'demo.html'));

    for (const { from, to, filter } of sources) {
      if (!fs.existsSync(from)) continue;
      const target = path.join(outDir, to);
      fs.mkdirSync(target, { recursive: true });
      for (const file of fs.readdirSync(from)) {
        if (!filter(file)) continue;
        const src = path.join(from, file);
        if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(target, file));
      }
    }
  };

  return {
    name: 'inmore-external-assets',

    /** In development, serve them from where they actually are. */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = sources.find(({ to }) => req.url?.startsWith(`/${to}/`));
        if (!match) return next();

        const name = decodeURIComponent(req.url.slice(match.to.length + 2).split('?')[0]);
        const file = path.join(match.from, name);

        // A request escaping the directory it names is a request we do not serve.
        if (!file.startsWith(match.from) || !fs.existsSync(file)) return next();

        res.setHeader(
          'Content-Type',
          file.endsWith('.json')
            ? 'application/json'
            : file.endsWith('.wasm')
              ? 'application/wasm'
              : 'application/javascript'
        );
        res.end(fs.readFileSync(file));
        return undefined;
      });
    },

    closeBundle() {
      copyInto(path.resolve(here, 'dist'));
    },
  };
}

export default defineConfig({
  plugins: [react(), externalAssets()],

  // The engine is a workspace package consumed as source, not as a build.
  optimizeDeps: { exclude: ['@inmore/engine', '@inmore/config-schema'] },

  build: {
    target: 'es2020',
    rollupOptions: {
      input: { frame: path.resolve(here, 'frame.html') },
    },

    /*
     * Deliberately no `manualChunks` here, unlike the site.
     *
     * Hand-splitting `three` and the R3F layer into named chunks looks like it
     * should help, and here it did the opposite. Rollup put React into the
     * `r3f` chunk, because that was where it was first reachable — so the
     * frame's 15 kB entry could not run without loading 423 kB of R3F, and the
     * whole point of the preflight checks was lost. It also produced a
     * production-only "Cannot read properties of null (reading
     * 'addEventListener')" from R3F, which did not occur in development or in
     * any unsplit build.
     *
     * The dynamic import of StudioMount is the split that matters, and Rollup
     * finds it on its own: entry 158 kB, StudioMount and everything under it
     * 1.02 MB, loaded only after WebGL, config, SKU and licence have all
     * passed. A frame that fails preflight fetches the entry and a JSON file
     * and nothing else — which is verifiable in the network panel, and was not
     * true with the hand-written chunks.
     */
    chunkSizeWarningLimit: 1200,
  },

  server: { port: 5174 },
});
