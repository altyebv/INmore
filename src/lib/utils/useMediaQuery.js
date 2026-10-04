import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query.
 *
 * The site's copy. The studio had one too and has taken it with it — but the
 * engine's now measures its own element rather than the viewport, because a
 * studio embedded in a column should lay itself out for the column. The site's
 * marketing pages genuinely are the viewport, so for them a media query is the
 * right question and this stays.
 *
 * Prerendered pages cannot know the viewport, so the server's answer is
 * always `false`; the real one arrives straight after hydration.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (notify) => {
      const list = window.matchMedia?.(query);
      if (!list) return () => {};
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
    () => false
  );
}

export default useMediaQuery;
