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

/**
 * Within the touch layout, the controls dock to the side rather than the
 * bottom whenever the screen is at least as wide as it is tall.
 *
 * The test is shape, not size, because the constraint is shape: a bottom sheet
 * spends height and a side panel spends width, and the right one to use is
 * whichever spends the axis the screen has to spare. A phone turned sideways
 * has roughly 390 px of height with a header already in it — a bottom sheet
 * there leaves the product a letterbox — while the same phone upright cannot
 * spare the width for a panel wide enough to hold a slider.
 */
export const STUDIO_SIDE_PANEL_QUERY = '(max-width: 1080px) and (min-aspect-ratio: 1/1)';

/** True on devices whose primary input cannot hover or hit small targets. */
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

export default useMediaQuery;
