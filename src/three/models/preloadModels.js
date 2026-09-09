import { useGLTF } from '@react-three/drei';

/**
 * Tracks whether a GLB's *download attempt* has finished — successfully or
 * not — independent of any component being mounted to look at it.
 *
 * `useGLTF.preload` shares its cache with `useGLTF` itself (both go through
 * drei's underlying loader cache), so once a URL is warmed here, a later
 * `<GlbProductModel>` mount for that same URL resolves immediately instead
 * of suspending.
 */
const settled = new Map();

function settle(url) {
  if (settled.has(url)) return settled.get(url);

  const promise = Promise.resolve()
    .then(() => useGLTF.preload(url))
    .catch(() => {
      // A failed preload just means the eventual <GlbProductModel> mount will
      // fail too — GlbLoadBoundary handles that, not this module.
    })
    .then(() => undefined);

  settled.set(url, promise);
  return promise;
}

/** Start downloading a batch of product GLBs ahead of time. */
export function preloadGlbModels(products) {
  products.forEach((product) => {
    const url = product?.model?.url;
    if (url) settle(url);
  });
}

/** Resolves once a GLB's load attempt has settled — cached or not yet. */
export function whenGlbSettled(url) {
  if (!url) return Promise.resolve();
  return settle(url);
}
