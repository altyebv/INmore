import { createContext, useContext, useMemo } from 'react';

/**
 * Where a tenant's models and the decoder that unpacks them live.
 *
 * The engine resolves every asset against a base the caller supplies, and has
 * no fallback host of its own. That is a hard rule rather than a preference:
 * an engine that knows a default CDN is an engine that will quietly serve one
 * client's models to another when a config is incomplete, and the failure mode
 * is a wrong product on a live page rather than an error anyone can see.
 *
 * An empty base means "resolve against the page's own origin", which is what
 * the standalone site wants — its models sit in `public/`.
 *
 * The Draco decoder is deliberately a separate setting. It is not tenant data:
 * every client's models are decompressed by the same wasm, and it belongs
 * wherever the *host* serves static files rather than under a client's CDN
 * prefix. Putting it in `assetBase` would mean copying the same decoder into
 * every tenant's bucket.
 */

const DEFAULTS = { assetBase: '', dracoPath: '/draco/' };

const AssetContext = createContext(DEFAULTS);

export function AssetProvider({ assetBase, dracoPath, children }) {
  const value = useMemo(
    () => ({
      assetBase: assetBase ?? DEFAULTS.assetBase,
      dracoPath: dracoPath ?? DEFAULTS.dracoPath,
    }),
    [assetBase, dracoPath]
  );
  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export function useAssetConfig() {
  return useContext(AssetContext);
}

export function useAssetBase() {
  return useAssetConfig().assetBase;
}

export function useDracoPath() {
  return useAssetConfig().dracoPath;
}

/**
 * Join a base and a relative path without producing a double slash or eating
 * one. Absolute URLs pass through untouched — a tenant may legitimately point
 * one product at a different host, and a data or blob URL is already resolved.
 */
export function resolveAsset(base, path) {
  if (!path) return path;
  if (/^(?:https?:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path)) return path;
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** The resolved URL for a path from a tenant config. */
export function useAsset(path) {
  const base = useAssetBase();
  return useMemo(() => resolveAsset(base, path), [base, path]);
}

export default useAsset;
