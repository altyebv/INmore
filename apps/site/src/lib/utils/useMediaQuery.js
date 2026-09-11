import { useEffect, useState } from 'react';

/**
 * Subscribe to a media query.
 *
 * The site's copy. The studio had one too and has taken it with it — but the
 * engine's now measures its own element rather than the viewport, because a
 * studio embedded in a column should lay itself out for the column. The site's
 * marketing pages genuinely are the viewport, so for them a media query is the
 * right question and this stays.
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

export default useMediaQuery;
