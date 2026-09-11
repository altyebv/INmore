import { useCallback, useEffect, useRef, useState } from 'react';
import composeArtwork, { getPrintRect, getSafeRect } from '@/lib/artwork/composeArtwork';
import { clamp, roundTo } from '@/lib/utils/math';
import { useT } from '@/i18n';
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
  const t = useT().studio.preview;

  const { print } = product;
  const rect = getPrintRect(print);
  const safe = getSafeRect(print);

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
          scale: transform.scale,
        };
        dragRef.current = null;
        return;
      }

      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: transform.x,
        originY: transform.y,
        width: stage.clientWidth,
        height: stage.clientHeight,
      };
    },
    [artwork, transform.x, transform.y, transform.scale]
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
        onTransform({ scale: clamp(pinch.scale * (distance / pinch.distance), 0.05, 2.5) }, false);
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      // The stage shows exactly the print area, so screen fraction maps
      // directly onto the -1…1 offset space.
      const dx = ((event.clientX - drag.startX) / drag.width) * 2;
      const dy = ((event.clientY - drag.startY) / drag.height) * 2;
      onTransform({ x: drag.originX + dx, y: drag.originY + dy }, false);
    },
    [onTransform]
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
      onTransform({ scale: clamp(transform.scale * factor, 0.05, 2.5) }, true);
    },
    [artwork, transform.scale, onTransform]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!artwork) return;
      const nudge = event.shiftKey ? 0.05 : 0.01;
      const moves = {
        ArrowLeft: { x: transform.x - nudge },
        ArrowRight: { x: transform.x + nudge },
        ArrowUp: { y: transform.y - nudge },
        ArrowDown: { y: transform.y + nudge },
      };
      const patch = moves[event.key];
      if (!patch) return;
      event.preventDefault();
      onTransform(patch, true);
    },
    [artwork, transform.x, transform.y, onTransform]
  );

  const aspect = rect.width / rect.height;
  const { physical } = print;

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
        <span className="u-ltr">
          {physical.widthMm} × {physical.heightMm} mm · {physical.safeMm} mm
        </span>
        {artwork && (
          <span className={artwork.isLowResolution ? styles.warn : undefined}>
            <span className="u-ltr">
              {artwork.width} × {artwork.height} px · {roundTo(transform.scale * 100, 0)}%
            </span>
            {artwork.isLowResolution ? ` · ${t.lowForPrint}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default FlatPreview;
