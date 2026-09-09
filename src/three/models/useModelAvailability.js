import { useEffect, useState } from 'react';

const cache = new Map();
const pending = new Map();

/**
 * Resolve (and cache) whether a model URL is really there.
 *
 * Shared by the hook below and the pre-warming helpers, so a given URL's HEAD
 * check only ever fires once — no matter how many components ask about it or
 * how many times a carousel loops back around to the same product.
 *
 * @returns {Promise<'available'|'missing'>}
 */
function checkAvailability(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  if (pending.has(url)) return pending.get(url);

  const request = fetch(url, { method: 'HEAD' })
    .then((response) => {
      const type = response.headers.get('content-type') ?? '';
      // A dev server happily returns index.html for unknown paths, so a 200
      // alone is not proof the model is there.
      const ok = response.ok && !type.includes('text/html');
      return ok ? 'available' : 'missing';
    })
    .catch(() => 'missing')
    .then((result) => {
      cache.set(url, result);
      pending.delete(url);
      return result;
    });

  pending.set(url, request);
  return request;
}

/**
 * Check whether a product's approved model has actually been added yet.
 *
 * Product configs point at their production GLB from day one. Until the file
 * exists we fall back to proxy geometry rather than crashing the studio, which
 * keeps the experience presentable while assets are still being approved.
 *
 * @returns {'checking'|'available'|'missing'}
 */
export function useModelAvailability(url) {
  const [status, setStatus] = useState(() => cache.get(url) ?? 'checking');

  useEffect(() => {
    if (!url) {
      setStatus('missing');
      return undefined;
    }
    if (cache.has(url)) {
      setStatus(cache.get(url));
      return undefined;
    }

    let cancelled = false;
    setStatus('checking');
    checkAvailability(url).then((result) => {
      if (!cancelled) setStatus(result);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}

/**
 * Kick off HEAD checks for a batch of URLs ahead of time. Call this as early
 * as possible (e.g. when a carousel mounts) so that by the time each product
 * actually needs an answer, `useModelAvailability` reads it straight from
 * cache instead of waiting on a fresh request.
 */
export function preloadModelAvailability(urls) {
  urls.filter(Boolean).forEach((url) => {
    checkAvailability(url);
  });
}

/** Resolves once a URL's availability is known — cached or not yet. */
export function whenAvailabilityKnown(url) {
  if (!url) return Promise.resolve('missing');
  return checkAvailability(url);
}

export default useModelAvailability;
