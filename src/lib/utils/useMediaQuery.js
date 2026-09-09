import { useEffect, useState } from 'react';

/**
 * Subscribe to a media query.
 *
 * Used to choose between the studio's two layouts. Deliberately a real query
 * rather than a user-agent check, so a narrow desktop window behaves like a
 * phone — which is also how it gets tested.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** The studio switches to its touch layout below this width. */
export const STUDIO_COMPACT_QUERY = '(max-width: 1080px)';

/** True on devices whose primary input cannot hover or hit small targets. */
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

export default useMediaQuery;
