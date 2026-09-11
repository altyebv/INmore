import { useGLTF } from '@react-three/drei';
import { useDracoPath } from '../../assets';

/**
 * Where the Draco decoder lives, when nobody says otherwise.
 *
 * Product models arrive Draco-compressed — a 900 KB gift box is 3 MB without
 * it. The decoder is vendored and served by the host rather than fetched from
 * a public CDN, so the studio works on networks that do not allow third-party
 * hosts. A host serving it from somewhere else passes `dracoPath`.
 */
export const DEFAULT_DRACO_PATH = '/draco/';

/** Load a product model, with the decoder this studio was pointed at. */
export function useProductGLTF(url) {
  return useGLTF(url, useDracoPath());
}

/**
 * Warm the cache for a model we know is coming next.
 *
 * Takes the decoder path explicitly rather than reading context: preloading
 * happens outside React — from carousels and route transitions — where there
 * is no context to read.
 */
export function preloadProductModel(url, dracoPath = DEFAULT_DRACO_PATH) {
  if (url) useGLTF.preload(url, dracoPath);
}

export default useProductGLTF;
