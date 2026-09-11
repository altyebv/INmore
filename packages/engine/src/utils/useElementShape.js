import { useEffect, useState } from 'react';

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
 * Within the compact layout, the panel takes a side rather than the bottom
 * whenever the studio is at least as wide as it is tall.
 *
 * The test is shape, not size, because the constraint is shape: a bottom sheet
 * spends height and a side panel spends width, and the right one is whichever
 * spends the axis there is room on. A phone turned sideways has barely 390 px
 * of height — a bottom sheet there leaves the product a letterbox — while the
 * same phone upright cannot spare the width for a panel wide enough to hold a
 * slider.
 */
export const SIDE_PANEL_RATIO = 1;

/**
 * @param {{ current: HTMLElement | null }} ref
 * @returns {{ width: number, height: number, compact: boolean, sidePanel: boolean }}
 */
export function useElementShape(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
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

  /*
   * Before the first measurement there is no honest answer, and guessing
   * "compact" would mount the touch layout and then tear it down a frame
   * later. The pointer layout is the safer first guess: it degrades to a
   * narrow column, where the touch layout in a wide space is simply wrong.
   */
  const width = size.width || COMPACT_WIDTH + 1;

  return {
    width: size.width,
    height: size.height,
    compact: width <= COMPACT_WIDTH,
    sidePanel: width <= COMPACT_WIDTH && size.height > 0 && width / size.height >= SIDE_PANEL_RATIO,
  };
}

export default useElementShape;
