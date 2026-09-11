import { useEffect, useState } from 'react';

/**
 * Subscribe to a media query.
 *
 * This used to answer the layout question too — whether to show the pointer or
 * the touch arrangement — and that was wrong for an embedded studio: it asked
 * how big the *window* is when what matters is how much room the studio has.
 * That moved to `useElementShape`, which measures the element.
 *
 * What is left is the one thing a media query genuinely answers better than an
 * element can: what kind of input the visitor has. A coarse pointer is a fact
 * about the person, not about the box the studio was given, and it stays true
 * whether the studio is a page or a panel in someone else's.
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

/** True on devices whose primary input cannot hover or hit small targets. */
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

export default useMediaQuery;
