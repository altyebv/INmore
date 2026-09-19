import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  composeLayers,
  getArtworkBox,
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
export function FlatPreview({
  product,
  artwork: imageArtwork,
  transform: imageTransform,
  baseColor,
  onTransform,
  onCommit,
  layers: suppliedLayers,
  selectedId,
  onSelect,
}) {
  /*
   * Everything placed on the print area, and which of it is being moved. A
   * host that passes only `artwork` and `transform` — the shape this component
   * always took — gets one layer, always selected.
   */
  const layers = useMemo(
    () =>
      suppliedLayers ??
      (imageArtwork
        ? [{ id: 'artwork', kind: 'image', artwork: imageArtwork, transform: imageTransform }]
        : []),
    [suppliedLayers, imageArtwork, imageTransform]
  );
  const active = layers.find((layer) => layer.id === selectedId) ?? layers[layers.length - 1];
  const artwork = active?.artwork ?? null;
  const transform = active?.transform;
  const hasLayers = layers.length > 0;

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

    composeLayers(buffer, print, layers, { stockColor: baseColor });

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
  }, [print, layers, baseColor, size, rect.x, rect.y, rect.width, rect.height]);

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
      if (!hasLayers) return;
      const stage = event.currentTarget;
      stage.setPointerCapture(event.pointerId);

      // Pick up whatever is under the pointer, topmost first. Only a single
      // finger chooses; a second one is a pinch on what is already selected.
      let target = active;
      if (pointersRef.current.size === 0 && layers.length > 1 && onSelect) {
        const bounds = stage.getBoundingClientRect();
        const px = rect.x + ((event.clientX - bounds.left) / bounds.width) * rect.width;
        const py = rect.y + ((event.clientY - bounds.top) / bounds.height) * rect.height;
        const hit = [...layers].reverse().find((layer) => {
          const box = getArtworkBox(print, layer.artwork, layer.transform);
          const angle = -((layer.transform.rotation ?? 0) * Math.PI) / 180;
          const dx = px - box.centreX;
          const dy = py - box.centreY;
          const lx = dx * Math.cos(angle) - dy * Math.sin(angle);
          const ly = dx * Math.sin(angle) + dy * Math.cos(angle);
          // A little slack, so a thin line of type can be grabbed.
          const slack = rect.width * 0.015;
          return Math.abs(lx) <= box.width / 2 + slack && Math.abs(ly) <= box.height / 2 + slack;
        });
        if (hit) {
          target = hit;
          if (hit.id !== active?.id) onSelect(hit.id);
        }
      }
      const origin = target?.transform ?? transform;
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
        originX: origin.xMm,
        originY: origin.yMm,
        width: stage.clientWidth,
        height: stage.clientHeight,
      };
    },
    [hasLayers, layers, active, onSelect, print, rect.x, rect.y, rect.width, rect.height, transform]
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
      if (!hasLayers) return;
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
    [hasLayers, transform, limits, onTransform]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!hasLayers) return;
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
    [hasLayers, transform, onTransform]
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
        data-empty={!hasLayers}
        role={hasLayers ? 'application' : 'img'}
        tabIndex={hasLayers ? 0 : -1}
        aria-label={hasLayers ? t.dragLabel : t.emptyAria}
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

        {active && (layers.length > 1 || active.kind === 'text') && (
          <SelectionBox print={print} rect={rect} layer={active} />
        )}

        {!hasLayers && <p className={styles.empty}>{t.emptyLabel}</p>}
      </div>

      <div className={styles.meta}>
        <span className={studioUtils.ltr}>
          {physical.widthMm} × {physical.heightMm} mm · {safeCaption} mm
        </span>
        {artwork && artwork.kind !== 'text' && (
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

/** The outline round the selected layer, turned with it. */
function SelectionBox({ print, rect, layer }) {
  const box = getArtworkBox(print, layer.artwork, layer.transform);
  return (
    <span
      className={styles.selection}
      aria-hidden="true"
      style={{
        left: `${((box.x - rect.x) / rect.width) * 100}%`,
        top: `${((box.y - rect.y) / rect.height) * 100}%`,
        width: `${(box.width / rect.width) * 100}%`,
        height: `${(box.height / rect.height) * 100}%`,
        transform: `rotate(${layer.transform.rotation ?? 0}deg)`,
      }}
    />
  );
}

export default FlatPreview;
