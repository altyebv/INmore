import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { liveProducts } from '@/products';
import styles from './HeroShowcase.module.css';

/**
 * Hero showcase — animated chain of live products.
 *
 * Each product is displayed for a fixed dwell time, then the component fades
 * to the next one with a coordinated colour accent shift. The sequence runs
 * indefinitely and pauses while the tab is hidden. Clicking a dot jumps
 * directly to that product.
 *
 * The 3D bundle is loaded lazily; during loading each slot shows a
 * colour-filled stand-in so the layout never shifts.
 */

const ProductViewer = lazy(() => import('@/three/ProductViewer'));

/** How long (ms) each product is on screen before the transition fires. */
const DWELL_MS = 3200;
/** How long (ms) the cross-fade takes. Must match the CSS transition. */
const FADE_MS = 700;

/**
 * One accent colour per product, in the same order as `liveProducts`.
 * These drive the animated gradient behind the product and the dot indicators.
 */
const PALETTE = [
  '#c8a05a', // warm gold     — paper cup
  '#7a9e8e', // sage green    — paper bag
  '#b07070', // dusty rose    — gift box
  '#6a7f9e', // slate blue    — mailer box
];

/** Framing used in the hero (slightly wider shot than the studio default). */
function heroCamera(product) {
  return {
    position: product.camera.position.map((v) => v * 1.15),
    fov: product.camera.fov ?? 28,
  };
}

export function HeroShowcase({ className }) {
  const count = liveProducts.length;
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(0); // rendered slot — lags behind active during fade
  const fadingRef = useRef(false);           // mutable flag avoids stale-closure issues
  const timerRef = useRef(null);
  const fadeRef = useRef(null);
  const activeRef = useRef(0);              // mirror of `active` for callbacks

  activeRef.current = active;

  /** Advance to a specific index with a cross-fade. */
  const goTo = (next) => {
    if (next === activeRef.current || fadingRef.current) return;
    fadingRef.current = true;
    setActive(next); // update accent colour immediately

    clearTimeout(fadeRef.current);
    fadeRef.current = setTimeout(() => {
      setVisible(next);
      fadingRef.current = false;
    }, FADE_MS);
  };

  /** Schedule the next auto-advance from the current active index. */
  const schedule = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const next = (activeRef.current + 1) % count;
      goTo(next);
    }, DWELL_MS);
  };

  // Re-schedule whenever the active product changes.
  useEffect(() => {
    schedule();
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(fadeRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Pause while the page is hidden, resume when it comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) clearTimeout(timerRef.current);
      else schedule();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accent = PALETTE[active % PALETTE.length];
  // `visible` only changes after the fade-out completes, so the old model
  // stays rendered while the canvas opacity goes to 0.
  const product = liveProducts[visible];

  // Canvas and label fade when active has moved ahead of visible.
  const isFading = visible !== active;

  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      style={{ '--showcase-accent': accent }}
    >
      {/* Animated gradient backdrop */}
      <div className={styles.backdrop} aria-hidden="true" />

      {/* 3-D canvas */}
      <div className={`${styles.canvas} ${isFading ? styles.canvasFading : ''}`}>
        <Suspense fallback={<div className={styles.placeholder} />}>
          <ProductViewer
            product={product}
            texture={null}
            autoRotate
            camera={heroCamera(product)}
          />
        </Suspense>
      </div>

      {/* Product label */}
      <div className={`${styles.label} ${isFading ? styles.labelFading : ''}`}>
        <span className={styles.labelCategory}>{product.category}</span>
        <span className={styles.labelName}>{product.shortName}</span>
      </div>

      {/* Dot navigation */}
      <div className={styles.dots} role="tablist" aria-label="Products">
        {liveProducts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={p.shortName}
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            style={{ '--dot-accent': PALETTE[i % PALETTE.length] }}
            onClick={() => {
              clearTimeout(timerRef.current);
              goTo(i);
            }}
          />
        ))}
      </div>

      {/* Progress bar — resets on every product change */}
      <div
        key={active}
        className={styles.progress}
        style={{ '--progress-dur': `${DWELL_MS}ms` }}
        aria-hidden="true"
      />
    </div>
  );
}

export default HeroShowcase;
