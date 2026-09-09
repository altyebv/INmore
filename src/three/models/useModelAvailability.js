import { useEffect, useState } from 'react';

const cache = new Map();

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

    fetch(url, { method: 'HEAD' })
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
        if (!cancelled) setStatus(result);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}

export default useModelAvailability;
