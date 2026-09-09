import { useCallback, useEffect, useRef, useState } from 'react';
import cx from '@/lib/utils/cx';
import { clamp } from '@/lib/utils/math';
import styles from './StudioSheet.module.css';

/**
 * Draggable bottom sheet for the touch studio.
 *
 * Three snap points rather than free height: a visitor should not have to
 * fine-tune a panel, and the stops correspond to real intents — glance at the
 * product, work on it, read the detail. The top stop deliberately stops short
 * of the screen so the product is always at least partly visible; watching it
 * change while you drag a slider is the entire reason the studio exists.
 */

/**
 * Stops are expressed as a fraction of the viewport. The top stop is capped
 * well below full height on purpose: if the sheet can bury the product, the
 * studio stops being a studio and becomes a form.
 */
export const SNAP_POINTS = { peek: 0.3, half: 0.52, full: 0.68 };
const ORDER = ['peek', 'half', 'full'];

export function StudioSheet({
  tabs,
  activeTab,
  onTabChange,
  snap,
  onSnapChange,
  gripLabel,
  footer,
  children,
}) {
  const [dragHeight, setDragHeight] = useState(null);
  const dragRef = useRef(null);

  const height = dragHeight ?? SNAP_POINTS[snap] ?? SNAP_POINTS.peek;

  const handlePointerDown = useCallback(
    (event) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { startY: event.clientY, startHeight: SNAP_POINTS[snap] };
      setDragHeight(SNAP_POINTS[snap]);
    },
    [snap]
  );

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = (drag.startY - event.clientY) / window.innerHeight;
    setDragHeight(clamp(drag.startHeight + delta, 0.16, SNAP_POINTS.full + 0.04));
  }, []);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    setDragHeight((current) => {
      const target = current ?? SNAP_POINTS[snap];
      const nearest = ORDER.reduce((best, key) =>
        Math.abs(SNAP_POINTS[key] - target) < Math.abs(SNAP_POINTS[best] - target) ? key : best
      );
      onSnapChange(nearest);
      return null;
    });
  }, [snap, onSnapChange]);

  // Keyboard equivalent of dragging the grip.
  const handleGripKey = useCallback(
    (event) => {
      const index = ORDER.indexOf(snap);
      if (event.key === 'ArrowUp' && index < ORDER.length - 1) {
        event.preventDefault();
        onSnapChange(ORDER[index + 1]);
      } else if (event.key === 'ArrowDown' && index > 0) {
        event.preventDefault();
        onSnapChange(ORDER[index - 1]);
      }
    },
    [snap, onSnapChange]
  );

  // Publish the sheet height so the viewer above can reserve room for it.
  useEffect(() => {
    document.documentElement.style.setProperty('--sheet-h', `${height * 100}svh`);
    return () => document.documentElement.style.removeProperty('--sheet-h');
  }, [height]);

  return (
    <section
      className={cx(styles.sheet, dragHeight === null && styles.settling)}
      style={{ '--sheet-h': `${height * 100}svh` }}
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
