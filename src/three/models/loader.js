import { useGLTF } from '@react-three/drei';

/**
 * Where the Draco decoder lives.
 *
 * Product models arrive Draco-compressed — a 900 KB gift box is 3 MB without
 * it. The decoder is vendored under `public/draco/` rather than loaded from a
 * CDN so the studio works on networks that do not allow third-party hosts.
 */
export const DRACO_PATH = '/draco/';

/** Load a product model with Draco support. */
export function useProductGLTF(url) {
  return useGLTF(url, DRACO_PATH);
}

/** Warm the cache for a model we know is coming next. */
export function preloadProductModel(url) {
  if (url) useGLTF.preload(url, DRACO_PATH);
}

export default useProductGLTF;
