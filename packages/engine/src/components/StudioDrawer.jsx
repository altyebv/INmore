import { useCallback, useId, useRef } from 'react';
import cx from '../utils/cx';
import IconButton from '../ui/IconButton';
import { ChevronIcon, CloseIcon } from '../ui/icons';
import styles from './StudioDrawer.module.css';

/**
 * The touch studio's controls: a rail of sections at the side, a panel that
 * opens from it, and a way to put both away.
 *
 * ## Why not a bottom sheet
 *
 * This replaced one. A sheet spends height, and on a phone height is where the
 * product lives: at the sheet's smallest stop the product had the top half of
 * the screen, at its largest a strip. The visitor was always looking at a
 * smaller product than the screen could show, which is backwards for a studio
 * whose job is to show the product.
 *
 * So the product always has the whole stage, and the controls have three
 * states instead of three heights:
 *
 * - **hidden** — a tab at the edge and nothing else.
 * - **peek**   — a slim rail of sections, floating in the product's margin and
 *                saying what can be changed.
 * - **open**   — one section's panel beside the rail.
 *
 * The product is full size in all three. The open panel floats over it —
 * translucent, so the product still reads through — rather than taking a share
 * of the stage, so the product never changes size as panels open and close.
 *
 * On a screen taller than it is wide the open panel is a card along the
 * bottom, beside the rail — a side panel wide enough for a slider leaves no
 * product on a 375 px phone. On a wide screen it runs the height of the side.
 * The rail is on the side either way, which keeps the gesture the same: swipe
 * towards the edge to put things away, away from it to bring them back.
 *
 * Every swipe has a button doing the same thing. A gesture is invisible until
 * someone tells you it is there.
 */

export const DRAWER_MODES = ['hidden', 'peek', 'open'];

/** How far a finger travels sideways, in px, before it counts as a swipe. */
const SWIPE_DISTANCE = 36;

/**
 * A horizontal flick, told apart from a tap.
 *
 * The end of the gesture is heard on the window rather than captured on the
 * element. Pointer capture would retarget the pointerup — and with it the
 * click — away from the button the finger started on, so making swipes work
 * that way would stop every tap on the rail from working.
 */
function useSwipe({ rtl, onEdgeward, onInward }) {
  const swallowUntil = useRef(0);

  const onPointerDown = useCallback(
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const from = { x: event.clientX, y: event.clientY };

      const end = (up) => {
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        if (up.type === 'pointercancel') return;

        const dx = up.clientX - from.x;
        const dy = up.clientY - from.y;
        if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;

        // A swipe that ends over a button must not also press it.
        swallowUntil.current = performance.now() + 400;
        // Docked on the inline end, so towards the edge is rightwards in LTR.
        const edgeward = rtl ? dx < 0 : dx > 0;
        (edgeward ? onEdgeward : onInward)?.();
      };

      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
    [rtl, onEdgeward, onInward]
  );

  const onClickCapture = useCallback((event) => {
    if (performance.now() > swallowUntil.current) return;
    swallowUntil.current = 0;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return { onPointerDown, onClickCapture };
}

/**
 * @param {{
 *   sections: { id: string, label: string, icon: React.ReactNode, disabled?: boolean }[],
 *   active: string,
 *   onSectionChange: (id: string) => void,
 *   mode: 'hidden'|'peek'|'open',
 *   onModeChange: (mode: 'hidden'|'peek'|'open') => void,
 *   orientation?: 'portrait'|'landscape',
 *   rtl?: boolean,
 *   labels: { label: string, show: string, hide: string, close: string },
 *   title: React.ReactNode,
 *   headerActions?: React.ReactNode,
 *   footer?: React.ReactNode,
 *   children: React.ReactNode,
 * }} props
 */
export function StudioDrawer({
  sections,
  active,
  onSectionChange,
  mode,
  onModeChange,
  orientation = 'portrait',
  rtl = false,
  labels,
  title,
  headerActions,
  footer,
  children,
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const titleId = `${id}-title`;

  const rootRef = useRef(null);
  const railRef = useRef(null);
  const panelRef = useRef(null);
  const handleRef = useRef(null);
  const railItems = useRef(new Map());

  const open = mode === 'open';
  const hidden = mode === 'hidden';

  /*
   * Change state, and keep keyboard focus somewhere that still exists. Putting
   * away the part of the drawer that holds focus would otherwise drop it on
   * the document, and a keyboard user would start again from the top of the
   * page.
   */
  const setMode = useCallback(
    (next) => {
      if (next === mode) return;
      const holds = (node) => Boolean(node?.contains(document.activeElement));

      if (next === 'hidden' && (holds(railRef.current) || holds(panelRef.current))) {
        handleRef.current?.focus();
      } else if (next !== 'open' && holds(panelRef.current)) {
        railItems.current.get(active)?.focus();
      } else if (next !== 'hidden' && holds(handleRef.current)) {
        // The rail is inert until this change renders.
        requestAnimationFrame(() => railItems.current.get(active)?.focus());
      }

      onModeChange(next);
    },
    [mode, active, onModeChange]
  );

  const select = (sectionId) => {
    if (open && sectionId === active) {
      setMode('peek');
      return;
    }
    onSectionChange(sectionId);
    setMode('open');
  };

  const railSwipe = useSwipe({ rtl, onEdgeward: () => setMode('hidden') });
  const handleSwipe = useSwipe({ rtl, onInward: () => setMode('peek') });
  const headerSwipe = useSwipe({ rtl, onEdgeward: () => setMode('peek') });

  const onKeyDown = (event) => {
    if (event.key !== 'Escape' || hidden) return;
    event.stopPropagation();
    setMode(open ? 'peek' : 'hidden');
  };

  return (
    <div
      ref={rootRef}
      className={styles.drawer}
      data-mode={mode}
      data-orientation={orientation}
      data-rtl={rtl ? '' : undefined}
      onKeyDown={onKeyDown}
    >
      <nav
        ref={railRef}
        className={styles.rail}
        aria-label={labels.label}
        aria-hidden={hidden || undefined}
        inert={hidden ? '' : undefined}
        {...railSwipe}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            ref={(node) => {
              if (node) railItems.current.set(section.id, node);
              else railItems.current.delete(section.id);
            }}
            type="button"
            className={styles.railItem}
            aria-expanded={open && section.id === active}
            aria-controls={panelId}
            disabled={section.disabled}
            onClick={() => select(section.id)}
          >
            <span className={styles.railIcon}>{section.icon}</span>
            <span className={styles.railLabel}>{section.label}</span>
          </button>
        ))}

        <button
          type="button"
          className={cx(styles.railItem, styles.railHide)}
          aria-label={labels.hide}
          title={labels.hide}
          onClick={() => setMode('hidden')}
        >
          <ChevronIcon className={styles.towardsEdge} />
        </button>
      </nav>

      <button
        ref={handleRef}
        type="button"
        className={styles.handle}
        aria-label={labels.show}
        title={labels.show}
        tabIndex={hidden ? 0 : -1}
        aria-hidden={hidden ? undefined : true}
        onClick={() => setMode('peek')}
        {...handleSwipe}
      >
        <ChevronIcon className={styles.awayFromEdge} />
      </button>

      <section
        id={panelId}
        ref={panelRef}
        className={styles.panel}
        aria-labelledby={titleId}
        aria-hidden={open ? undefined : true}
        inert={open ? undefined : ''}
      >
        <header className={styles.panelHeader} {...headerSwipe}>
          <h2 id={titleId} className={styles.panelTitle}>
            {title}
          </h2>
          <div className={styles.panelActions}>
            {headerActions}
            <IconButton label={labels.close} onClick={() => setMode('peek')}>
              <CloseIcon />
            </IconButton>
          </div>
        </header>

        <div className={styles.panelBody}>{children}</div>

        {footer && <div className={styles.panelFooter}>{footer}</div>}
      </section>
    </div>
  );
}

export default StudioDrawer;
