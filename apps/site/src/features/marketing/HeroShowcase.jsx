import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paletteFor } from '@/products';
import { useContent, useLocale } from '@/i18n';
import { localizeProduct } from '@/i18n/localizeProduct';
import useMediaQuery from '@/lib/utils/useMediaQuery';
import styles from './HeroShowcase.module.css';

/**
 * The hero product rail — everything around the 3-D scene.
 *
 * The whole catalogue is on screen at once, on a curved rail, with one product
 * in focus. The alternative this replaced showed one product at a time and
 * handed over to the next; the range was then something a visitor had to wait
 * to discover rather than something the page opens with. (That version is still
 * in the tree as `three/ShowcaseScene.jsx` — swapping back is a one-line change
 * here.)
 *
 * Split cleanly: `HeroRail` owns the arc, the light and the fog; this component
 * owns which product is selected and every way a visitor can say so. The two
 * meet at one mutable ref. A React state update per animation frame would
 * re-render the whole hero sixty times a second for a number only the render
 * loop reads, so the target index is written to a ref the loop polls, and
 * component state changes only when the *selected product* changes — a few
 * times a minute, not sixty times a second.
 *
 * Ways to move the rail, in the order visitors reach for them: swipe or drag,
 * click a product that is not centred, the arrows, a trackpad's horizontal
 * scroll, the keyboard. All of them go through `select`, which also stands the
 * auto-advance down — once someone is steering, the carousel stops steering
 * itself.
 */

const HeroCanvas = lazy(() => import('@/three/HeroCanvas'));

/** How long a product holds the centre before the rail moves on. */
const DWELL_MS = 4200;

/** Auto-advance stays off for this long after any deliberate interaction. */
const RESUME_AFTER_MS = 9000;

/** Horizontal drag, as a fraction of the viewport, that advances one product. */
const DRAG_TRAVEL = 0.22;

export function HeroShowcase({ products: source = [], className }) {
  const { ui } = useContent();
  const copy = ui.home;
  const { locale, isRTL } = useLocale();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const compact = useMediaQuery('(max-width: 900px)');

  // Names and categories are read on screen, so they have to be the visitor's.
  // `localizeProduct` swaps only the readable fields, so what reaches the rail
  // is still a complete product config.
  const products = useMemo(
    () => source.map((product) => localizeProduct(product, locale)),
    [source, locale]
  );
  const count = products.length;

  const [active, setActive] = useState(0);

  // The rail's target and current position. Written here, read by the render
  // loop — never rendered from, so they are refs rather than state.
  const targetRef = useRef(0);
  const progressRef = useRef(0);
  const idleUntil = useRef(0);
  const container = useRef(null);

  /**
   * Aim the rail at a slot.
   *
   * The slot index is unbounded on purpose: the rail wraps modulo its slot
   * count, so counting past the end keeps turning the same way instead of
   * spinning all the way back round the other way, which is what a visitor
   * pressing "next" on the last product expects to see.
   *
   * Note what this does *not* do: set `active`. The name under the rail and the
   * marker below it follow the rail's actual position, reported back by
   * `onCentreChange` as it crosses the halfway point between two products.
   * Setting them here instead would be a frame cheaper and visibly wrong — the
   * label would name the next product for the whole second the rail spends
   * still moving towards it.
   */
  const select = useCallback((slot, { manual = true } = {}) => {
    targetRef.current = slot;
    if (manual) idleUntil.current = Date.now() + RESUME_AFTER_MS;
  }, []);

  /** The rail reports which product it has actually arrived over. */
  const onCentreChange = useCallback(
    (slot) => setActive(((slot % count) + count) % count),
    [count]
  );

  const step = useCallback(
    (delta) => select(Math.round(targetRef.current) + delta),
    [select]
  );

  // --- Auto-advance ---------------------------------------------------------
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = setInterval(() => {
      if (document.hidden || Date.now() < idleUntil.current) return;
      select(Math.round(targetRef.current) + 1, { manual: false });
    }, DWELL_MS);
    return () => clearInterval(timer);
  }, [select, reducedMotion]);

  // --- Keyboard -------------------------------------------------------------
  // Arrow keys follow reading order, so in Arabic "next" is the left arrow.
  useEffect(() => {
    const node = container.current;
    if (!node) return undefined;
    const forward = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const back = isRTL ? 'ArrowRight' : 'ArrowLeft';
    const onKey = (event) => {
      if (event.key === forward) { event.preventDefault(); step(1); }
      else if (event.key === back) { event.preventDefault(); step(-1); }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [step, isRTL]);

  // --- Drag and swipe -------------------------------------------------------
  const drag = useRef(null);

  const onPointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, base: targetRef.current, moved: 0 };
    idleUntil.current = Date.now() + RESUME_AFTER_MS;
  }, []);

  const onPointerMove = useCallback(
    (event) => {
      const state = drag.current;
      if (!state || state.id !== event.pointerId) return;
      const travel = (event.clientX - state.x) / (window.innerWidth * DRAG_TRAVEL);
      state.moved = Math.abs(event.clientX - state.x);
      // Dragging right should bring the product on the left forward.
      targetRef.current = state.base + (isRTL ? travel : -travel);
    },
    [isRTL]
  );

  const endDrag = useCallback(() => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    // A tap is not a drag; leave the rail where it was and let the click land.
    if (state.moved < 6) {
      targetRef.current = state.base;
      return;
    }
    select(Math.round(targetRef.current));
  }, [select]);

  // --- Trackpad -------------------------------------------------------------
  // Only horizontal intent steers the rail; vertical scroll belongs to the page.
  const wheelLock = useRef(0);
  const onWheel = useCallback(
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 8) return;
      const now = Date.now();
      if (now < wheelLock.current) return;
      wheelLock.current = now + 420;
      step(event.deltaX > 0 ? 1 : -1);
    },
    [step]
  );

  const onSelectSlot = useCallback(
    (slot) => {
      // The rail hands back a slot index; steer to the nearest turn of it so
      // clicking the product on the left never spins the long way round.
      const current = targetRef.current;
      const span = count * 2;
      select(slot + Math.round((current - slot) / span) * span);
    },
    [count, select]
  );

  const product = products[active];
  // The accent follows the product's own default stock, so the colour behind
  // the rail is the board it is actually printed on.
  const accentFor = useCallback((item) => paletteFor(item)[0].color, []);
  const accent = accentFor(product);

  const dpr = useMemo(() => (compact ? [1, 1.5] : [1, 2]), [compact]);

  return (
    <div
      ref={container}
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      style={{ '--showcase-accent': accent }}
      role="group"
      aria-roledescription="carousel"
      aria-label={copy.carouselLabel}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
    >
      <div className={styles.halo} aria-hidden="true" />

      <div className={styles.canvas}>
        <Suspense fallback={null}>
          <HeroCanvas
            products={products}
            targetRef={targetRef}
            progressRef={progressRef}
            onSelect={onSelectSlot}
            onCentreChange={onCentreChange}
            reducedMotion={reducedMotion}
            dpr={dpr}
          />
        </Suspense>
      </div>

      {/* Arrows sit either side of the centred product: close enough to read as
          its controls, not the page's. */}
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        aria-label={copy.previousProduct}
        onClick={() => step(-1)}
      >
        <Chevron />
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowNext}`}
        aria-label={copy.nextProduct}
        onClick={() => step(1)}
      >
        <Chevron />
      </button>

      <div className={styles.readout}>
        {/* Keyed so each product's name animates in, rather than the text
            swapping under a static element. */}
        <p key={`${product.id}-category`} className={styles.category}>
          {product.category}
        </p>
        <p key={product.id} className={styles.name}>
          {product.shortName}
        </p>

        <div className={styles.rail} role="tablist" aria-label={copy.carouselLabel}>
          {products.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={copy.showProduct.replace('{product}', item.shortName)}
              className={`${styles.pip} ${index === active ? styles.pipActive : ''}`}
              style={{ '--pip-accent': accentFor(item) }}
              onClick={() => onSelectSlot(index)}
            >
              <span className={styles.pipTrack} />
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="u-visually-hidden">
        {product.name}
      </p>
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default HeroShowcase;
