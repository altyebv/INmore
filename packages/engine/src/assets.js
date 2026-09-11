import { createContext, useContext } from 'react';

/**
 * Where a tenant's models and textures live.
 *
 * The engine resolves every asset against a base the caller supplies, and has
 * no fallback host of its own. That is a hard rule rather than a preference:
 * an engine that knows a default CDN is an engine that will quietly serve one
 * client's models to another when a config is incomplete, and the failure mode
 * is a wrong product on a live page rather than an error anyone can see.
 *
 * An empty base means "resolve against the page's own origin", which is what
 * the standalone site wants — its models are in `public/`.
 */

const AssetBaseContext = createContext('');

export const AssetBaseProvider = AssetBaseContext.Provider;

export function useAssetBase() {
  return useContext(AssetBaseContext);
}

/**
 * Join a base and a relative path without producing a double slash or eating
 * one. Absolute URLs pass through untouched — a tenant may legitimately point
 * a single product at a different host.
 */
export function resolveAsset(base, path) {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** The resolved URL for a path from a tenant config. */
export function useAsset(path) {
  return resolveAsset(useAssetBase(), path);
}

export default useAsset;
