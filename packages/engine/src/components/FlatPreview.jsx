import { useCallback, useEffect, useRef, useState } from 'react';
import composeArtwork, {
  getPrintRect,
  getSafeRect,
  normaliseSafe,
} from '../artwork/composeArtwork';
import { transformLimitsFor } from '../state/studioReducer';
import { clamp, roundTo } from '../utils/math';
import { useCopy } from '../i18n';
import cx from '../utils/cx';
import { studioUtils } from '../StudioRoot';
import styles from './FlatPreview.module.css';

/**
 * The flat print area — the artwork as it will be laid out before the product
 * is formed.
 *
 * This is where positioning actually happens: the visitor drags the artwork
 * here and watches it move on the product beside them. It draws from the same
 * compositor the 3D texture uses, so the two views can never disagree.
 */
export function FlatPreview({ product, artwork, transform, baseColor, onTransform, onCommit }) {
  const displayRef = useRef(null);
  const bufferRef = useRef(null);
  const dragRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const t = useCopy().preview;

  const { print } = product;
  const { physical } = print;
  const rect = getPrintRect(print);
  const safe = getSafeRect(print);
  const limits = transformLimitsFor(print);

  if (!bufferRef.current && typeof document !== 'undefined') {
    bufferRef.current = document.createElement('canvas');
  }

  // Redraw whenever the placement changes.
  useEffect(() => {
    const display = displayRef.current;
    const buffer = bufferRef.current;
    if (!display || !buffer) return;

    composeArtwork(buffer, print, artwork, transform, { stockColor: baseColor });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = display.clientWidth;
    const height = display.clientHeight;
    if (!width || !height) return;

    if (display.width !== Math.round(width * dpr)) display.width = Math.round(width * dpr);
    if (display.height !== Math.round(height * dpr)) display.height = Math.round(height * dpr);

    const ctx = display.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    // Show only the printable window, scaled to fill the stage.
    ctx.drawImage(buffer, rect.x, rect.y, rect.width, rect.height, 0, 0, width, height);
  }, [print, artwork, transform, baseColor, size, rect.x, rect.y, rect.width, rect.height]);

  // Keep the drawing crisp through container resizes.
  useEffect(() => {
    const display = displayRef.current;
    if (!display) return undefined;
    const measure = () =>
      setSize((current) =>
        current.width === display.clientWidth && current.height === display.clientHeight
          ? current
          : { width: display.clientWidth, height: display.clientHeight }
      );
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(display);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!artwork) return;
      const stage = event.currentTarget;
      stage.setPointerCapture(event.pointerId);
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointersRef.current.size === 2) {
        // A second finger switches from moving to resizing.
        const [a, b] = [...pointersRef.current.values()];
        pinchRef.current = {
          distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          widthMm: transform.widthMm,
        };
        dragRef.current = null;
        return;
      }

      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: transform.xMm,
        originY: transform.yMm,
        width: stage.clientWidth,
        height: stage.clientHeight,
      };
    },
    [artwork, transform.xMm, transform.yMm, transform.widthMm]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (pointersRef.current.has(event.pointerId)) {
        pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      const pinch = pinchRef.current;
      if (pinch && pointersRef.current.size === 2) {
        const [a, b] = [...pointersRef.current.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        onTransform(
          {
            widthMm: clamp(
              pinch.widthMm * (distance / pinch.distance),
              limits.widthMm.min,
              limits.widthMm.max
            ),
          },
          false
        );
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      /*
       * The stage shows exactly the print area, so a fraction of the stage is
       * the same fraction of the product — and because the print area's real
       * size is known, that fraction converts straight to millimetres. Dragging
       * a logo 30% across a 250 mm wrap moves it 75 mm, and says so.
       */
      const dx = ((event.clientX - drag.startX) / drag.width) * physical.widthMm;
      const dy = ((event.clientY - drag.startY) / drag.height) * physical.heightMm;
      onTransform({ xMm: drag.originX + dx, yMm: drag.originY + dy }, false);
    },
    [onTransform, physical.widthMm, physical.heightMm]
  );

  const endDrag = useCallback(
    (event) => {
      if (event?.pointerId !== undefined) pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (!dragRef.current && !pinchRef.current) {
        if (pointersRef.current.size === 0) onCommit?.();
        return;
      }
      if (pointersRef.current.size === 0) {
        dragRef.current = null;
        onCommit?.();
      }
    },
    [onCommit]
  );

  // Wheel over the print area resizes the artwork — the gesture people already
  // expect from every other placement tool.
  const handleWheel = useCallback(
    (event) => {
      if (!artwork) return;
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.94 : 1.06;
      onTransform(
        {
          widthMm: clamp(
            transform.widthMm * factor,
            limits.widthMm.min,
            limits.widthMm.max
          ),
        },
        true
      );
    },
    [artwork, transform.widthMm, limits, onTransform]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!artwork) return;
      // A millimetre at a time, or five with shift. Real units mean the nudge
      // is the same physical distance on every product rather than a fraction
      // that means 2.5 mm on a cup and 12 mm on a bag.
      const nudge = event.shiftKey ? 5 : 1;
      const moves = {
        ArrowLeft: { xMm: transform.xMm - nudge },
        ArrowRight: { xMm: transform.xMm + nudge },
        ArrowUp: { yMm: transform.yMm - nudge },
        ArrowDown: { yMm: transform.yMm + nudge },
      };
      const patch = moves[event.key];
      if (!patch) return;
      event.preventDefault();
      onTransform(patch, true);
    },
    [artwork, transform.xMm, transform.yMm, onTransform]
  );

  const aspect = rect.width / rect.height;

  /*
   * Safe margins are per edge now. A cup's rim curl eats more than its base
   * does, and a bag's handle bar crosses the top of the panel — one number
   * could only ever be the worst case applied everywhere. The caption stays a
   * single figure while the edges agree, and becomes a range when they do not,
   * because that is the honest summary of four numbers in the width of a line.
   */
  const safeEdges = normaliseSafe(physical.safeMm);
  const safeValues = Object.values(safeEdges);
  const safeLow = Math.min(...safeValues);
  const safeHigh = Math.max(...safeValues);
  const safeCaption = safeLow === safeHigh ? `${safeLow}` : `${safeLow}–${safeHigh}`;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.stage}
        style={{ '--preview-aspect': aspect }}
        data-empty={!artwork}
        role={artwork ? 'application' : 'img'}
        tabIndex={artwork ? 0 : -1}
        aria-label={artwork ? t.dragLabel : t.emptyAria}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      >
        <canvas ref={displayRef} className={styles.canvas} />

        <div
          className={styles.guide}
          style={{
            left: `${((safe.x - rect.x) / rect.width) * 100}%`,
            top: `${((safe.y - rect.y) / rect.height) * 100}%`,
            width: `${(safe.width / rect.width) * 100}%`,
            height: `${(safe.height / rect.height) * 100}%`,
          }}
        />

        {print.wrap && (
          <>
            <span className={styles.seam} style={{ left: 0 }} />
            <span className={styles.seam} style={{ left: '100%' }} />
            <span className={styles.seamLabel} style={{ left: '0%' }}>
              {t.seam}
            </span>
            <span className={styles.seamLabel} style={{ left: '100%' }}>
              {t.seam}
            </span>
          </>
        )}

        {!artwork && <p className={styles.empty}>{t.emptyLabel}</p>}
      </div>

      <div className={styles.meta}>
        <span className={studioUtils.ltr}>
          {physical.widthMm} × {physical.heightMm} mm · {safeCaption} mm
        </span>
        {artwork && (
          <span className={artwork.isLowResolution ? styles.warn : undefined}>
            <span className={studioUtils.ltr}>
              {artwork.width} × {artwork.height} px ·{' '}
              {roundTo((transform.widthMm / physical.widthMm) * 100, 0)}%
            </span>
            {artwork.isLowResolution ? ` · ${t.lowForPrint}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default FlatPreview;
