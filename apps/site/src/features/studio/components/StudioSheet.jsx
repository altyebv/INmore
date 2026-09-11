import { useCallback, useEffect, useRef, useState } from 'react';
import cx from '@/lib/utils/cx';
import { clamp } from '@/lib/utils/math';
import styles from './StudioSheet.module.css';

/**
 * The touch studio's control panel — a draggable sheet that docks to whichever
 * edge the screen can spare.
 *
 * ## Why the edge moves
 *
 * The sheet exists to solve one problem: on a small screen the controls and the
 * product must be visible at the same time, because watching the product change
 * while you drag a slider is the whole reason the studio exists. Which edge
 * does that best depends entirely on the shape of the screen, and a phone
 * changes shape when it is turned:
 *
 * - **Upright**, height is the plentiful axis and width is not. A 390 px-wide
 *   screen cannot give a side panel enough room for a slider *and* keep the
 *   product legible, so the sheet takes the bottom and the two stack.
 * - **Turned sideways**, that reverses. There are barely 390 px of height, most
 *   of it already spent on the header, and a bottom sheet at its smallest stop
 *   leaves the product a letterbox. The panel goes to the side, the product
 *   keeps full height, and both are comfortable.
 *
 * The stops, the drag, the tabs and the peek behaviour are identical either
 * way — only the axis changes. That is deliberate: which edge to use is a
 * layout decision, and two components would have been two implementations of
 * the same interaction, drifting apart.
 *
 * ## The stops
 *
 * Three fixed stops rather than free resizing: a visitor should not have to
 * fine-tune a panel, and the stops correspond to real intents — glance at the
 * product, work on it, read the detail. The largest stop deliberately falls
 * short of the whole screen so the product is always at least partly visible.
 * If the sheet can bury the product, the studio stops being a studio and
 * becomes a form.
 */

/**
 * Stops as a fraction of the axis the sheet grows along.
 *
 * The side stops are larger fractions than the bottom ones because they are
 * fractions of a *landscape* width — 44 % of an 844 px screen is a comfortable
 * 370 px column, while 44 % of that screen's height would be a slot.
 */
export const SNAP_POINTS = { peek: 0.3, half: 0.52, full: 0.68 };
export const SIDE_SNAP_POINTS = { peek: 0.3, half: 0.44, full: 0.58 };
const ORDER = ['peek', 'half', 'full'];

export function StudioSheet({
  tabs,
  activeTab,
  onTabChange,
  snap,
  onSnapChange,
  gripLabel,
  footer,
  /** Which edge the sheet is docked to. 'inline-end' follows reading direction. */
  edge = 'bottom',
  /** Reading direction, so a side sheet knows which way "open" is. */
  rtl = false,
  children,
}) {
  const side = edge === 'inline-end';
  const stops = side ? SIDE_SNAP_POINTS : SNAP_POINTS;

  const [dragSize, setDragSize] = useState(null);
  const dragRef = useRef(null);

  const size = dragSize ?? stops[snap] ?? stops.peek;

  const handlePointerDown = useCallback(
    (event) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        start: side ? event.clientX : event.clientY,
        startSize: stops[snap],
      };
      setDragSize(stops[snap]);
    },
    [snap, side, stops]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      // Opening always means dragging *away* from the edge the sheet is on:
      // upwards from the bottom, and inwards from whichever side it sits on.
      const travel = side
        ? ((drag.start - event.clientX) / window.innerWidth) * (rtl ? -1 : 1)
        : (drag.start - event.clientY) / window.innerHeight;
      setDragSize(clamp(drag.startSize + travel, 0.16, stops.full + 0.04));
    },
    [side, rtl, stops]
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    setDragSize((current) => {
      const target = current ?? stops[snap];
      const nearest = ORDER.reduce((best, key) =>
        Math.abs(stops[key] - target) < Math.abs(stops[best] - target) ? key : best
      );
      onSnapChange(nearest);
      return null;
    });
  }, [snap, onSnapChange, stops]);

  // Keyboard equivalent of dragging the grip. The key that opens the sheet is
  // the one pointing away from its edge.
  const handleGripKey = useCallback(
    (event) => {
      const open = side ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
      const close = side ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
      const index = ORDER.indexOf(snap);
      if (event.key === open && index < ORDER.length - 1) {
        event.preventDefault();
        onSnapChange(ORDER[index + 1]);
      } else if (event.key === close && index > 0) {
        event.preventDefault();
        onSnapChange(ORDER[index - 1]);
      }
    },
    [snap, onSnapChange, side, rtl]
  );

  // Publish the sheet's extent so the viewer beside or above it can reserve
  // exactly that much room and resize as the sheet moves. Both custom
  // properties are always written — the unused one zeroed — so turning the
  // phone, which changes the edge, cannot leave a stale reservation behind on
  // the axis the sheet just left.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sheet-h', side ? '0px' : `${size * 100}svh`);
    root.style.setProperty('--sheet-w', side ? `${size * 100}vw` : '0px');
    return () => {
      root.style.removeProperty('--sheet-h');
      root.style.removeProperty('--sheet-w');
    };
  }, [size, side]);

  return (
    <section
      className={cx(
        styles.sheet,
        side ? styles.edgeSide : styles.edgeBottom,
        dragSize === null && styles.settling
      )}
      style={{ '--sheet-extent': side ? `${size * 100}vw` : `${size * 100}svh` }}
      aria-label={gripLabel}
    >
      <button
        type="button"
        className={styles.grip}
        aria-label={gripLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleGripKey}
      >
        <span className={styles.gripBar} />
      </button>

      <div className={styles.tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`studio-tab-${tab.id}`}
            aria-selected={tab.id === activeTab}
            aria-controls={`studio-panel-${tab.id}`}
            className={styles.tab}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {tab.complete && <span className={styles.tabDone} aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div
        className={styles.body}
        role="tabpanel"
        id={`studio-panel-${activeTab}`}
        aria-labelledby={`studio-tab-${activeTab}`}
      >
        {children}
      </div>

      {footer && <div className={styles.footerBar}>{footer}</div>}
    </section>
  );
}

export default StudioSheet;
