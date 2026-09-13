import { useLayoutEffect, useState } from 'react';

/**
 * Measure the room an element actually has.
 *
 * This replaces a pair of viewport media queries, and the replacement is not
 * cosmetic. A viewport query answers "how big is the window", which is the
 * right question exactly once: when the studio *is* the page. Mounted in a
 * 600 px column on a 1920 px desktop, a viewport query picks the pointer
 * layout — a sticky side panel next to a viewer — and that layout then
 * overflows the column it was given. Inside an iframe the viewport is the
 * frame, which happens to be right, but relying on that is relying on the
 * embed always being an iframe.
 *
 * So the studio measures itself.
 */

/** Below this width the controls dock to an edge instead of sitting beside. */
export const COMPACT_WIDTH = 1080;

/**
 * @param {{ current: HTMLElement | null }} ref
 * @returns {{
 *   width: number,
 *   height: number,
 *   measured: boolean,
 *   compact: boolean,
 *   landscape: boolean,
 * }}
 */
export function useElementShape(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  /*
   * Measured in a layout effect, so the answer is in before the browser
   * paints. The first version measured after paint and guessed in the
   * meantime, which put a desktop layout on a phone for one frame — a grid
   * with a 320 px column, wider than the screen — and mounted a renderer only
   * to tear it down again.
   */
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      setSize((current) =>
        Math.round(current.width) === Math.round(width) &&
        Math.round(current.height) === Math.round(height)
          ? current
          : { width, height }
      );
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      // Older browsers, and jsdom. The viewport is the honest fallback.
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return {
    width: size.width,
    height: size.height,
    measured: size.width > 0,
    compact: size.width > 0 && size.width <= COMPACT_WIDTH,
    /*
     * Measure the element whose shape you mean. The studio's own root is the
     * wrong one for this on a touch layout: its shell is pinned to the
     * viewport and out of flow, so the root is zero pixels tall — which is how
     * a phone turned sideways used to be told it was upright.
     */
    landscape: size.height > 0 && size.width >= size.height,
  };
}

export default useElementShape;
