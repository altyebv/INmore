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
 * Used to copy every tenant's `tenants/*.json` and every product's
 * `apps/site/public/models/*.glb` into every deployment's `dist/` — which
 * meant one client's build shipped every other client's config and models at
 * guessable URLs. Both now come from R2 at runtime, scoped to the tenant the
 * deployment is actually for (see `frame.jsx`'s `VITE_ASSET_BASE`), so
 * neither is copied here any more.
 *
 * The Draco decoder is still local for now: it is the same wasm for every
 * client, not tenant data, so bundling it carries none of the leak the
 * configs and models did.
 */
function externalAssets() {
  const sources = [
    { from: path.join(root, 'apps/site/public/draco'), to: 'draco', filter: () => true },
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
      /*
       * Serve /embed.js in development, bundled the way it actually ships.
       *
       * The loader is the one file a client's page loads with a plain script
       * tag, so it is built as an IIFE — which means Vite's module server
       * cannot serve it: demo.html would get an ES module where it expects a
       * classic script, and `document.currentScript` would be null.
       *
       * Without this, testing the snippet meant a full build every time, and
       * "run the dev server" would not have been the honest answer to how to
       * work on this. It is the same esbuild Vite already depends on, on a
       * file measured in kilobytes, so rebuilding per request costs nothing.
       */
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/embed.js') return next();

        try {
          const { build } = await import('esbuild');
          const result = await build({
            entryPoints: [path.join(here, 'src/loader.js')],
            bundle: true,
            format: 'iife',
            target: 'es2018',
            write: false,
          });
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store');
          res.end(result.outputFiles[0].text);
        } catch (error) {
          res.statusCode = 500;
          res.end(`/* embed.js failed to build: ${error.message} */`);
        }
        return undefined;
      });

      server.middlewares.use((req, res, next) => {
        const match = sources.find(({ to }) => req.url?.startsWith(`/${to}/`));
        if (!match) return next();

        const name = decodeURIComponent(req.url.slice(match.to.length + 2).split('?')[0]);
        const file = path.join(match.from, name);

        /*
         * A request escaping the directory it names is a request we do not
         * serve. The separator matters: a bare prefix test lets
         * `/tenants/../tenants-private/x` through, because "tenants-private"
         * starts with "tenants".
         */
        if (!file.startsWith(match.from + path.sep) || !fs.existsSync(file)) return next();
        if (!fs.statSync(file).isFile()) return next();

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
