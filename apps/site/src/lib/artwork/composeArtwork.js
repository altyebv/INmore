import { clamp, degToRad } from '@/lib/utils/math';
import { IDENTITY_CROP } from './constants';

/**
 * Turn an uploaded image plus a placement into the flat print layout.
 *
 * This module is the single place where artwork becomes pixels. It knows
 * nothing about React or Three.js — it takes a product's print configuration
 * and a transform, and returns a canvas. The 3D layer consumes that canvas as
 * a texture; the 2D preview draws the same canvas. One source of truth means
 * what the visitor arranges is exactly what appears on the product.
 */

/** Pixel rect of the printable window inside the full texture. */
export function getPrintRect(print) {
  const { texture, uv } = print;
  return {
    x: Math.round(uv.x * texture.width),
    y: Math.round(uv.y * texture.height),
    width: Math.round(uv.width * texture.width),
    height: Math.round(uv.height * texture.height),
  };
}

/** Inset rect representing the "guaranteed to print" safe area. */
export function getSafeRect(print) {
  const rect = getPrintRect(print);
  const { physical } = print;
  const insetX = (physical.safeMm / physical.widthMm) * rect.width;
  const insetY = (physical.safeMm / physical.heightMm) * rect.height;
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    width: rect.width - insetX * 2,
    height: rect.height - insetY * 2,
  };
}

/**
 * Resolve a transform into the placed artwork box, in texture pixels.
 * Exported so the 2D preview can hit-test and drag without duplicating maths.
 */
export function getArtworkBox(print, artwork, transform) {
  const rect = getPrintRect(print);
  const crop = transform.crop ?? IDENTITY_CROP;

  const croppedAspect = (artwork.aspect * crop.width) / crop.height;

  const width = rect.width * clamp(transform.scale, 0.02, 3);
  const height = width / croppedAspect;

  const centreX = rect.x + rect.width / 2 + (transform.x * rect.width) / 2;
  const centreY = rect.y + rect.height / 2 + (transform.y * rect.height) / 2;

  return { x: centreX - width / 2, y: centreY - height / 2, width, height, centreX, centreY };
}

/** Scale that makes the artwork exactly fill the print area's height. */
export function getFitScale(print, artwork, transform, mode = 'contain') {
  const rect = getPrintRect(print);
  const crop = transform.crop ?? IDENTITY_CROP;
  const croppedAspect = (artwork.aspect * crop.width) / crop.height;
  const widthIfHeightFilled = rect.height * croppedAspect;

  if (mode === 'cover') return Math.max(1, widthIfHeightFilled / rect.width);
  return Math.min(1, widthIfHeightFilled / rect.width);
}

function drawPlacement(ctx, artwork, box, transform, offsetX) {
  const crop = transform.crop ?? IDENTITY_CROP;
  const sx = crop.x * artwork.width;
  const sy = crop.y * artwork.height;
  const sw = crop.width * artwork.width;
  const sh = crop.height * artwork.height;

  ctx.save();
  ctx.translate(box.centreX + offsetX, box.centreY);
  if (transform.rotation) ctx.rotate(degToRad(transform.rotation));
  ctx.drawImage(
    artwork.source,
    sx,
    sy,
    sw,
    sh,
    -box.width / 2,
    -box.height / 2,
    box.width,
    box.height
  );
  ctx.restore();
}

/**
 * Composite the print layout onto a canvas.
 *
 * @param {HTMLCanvasElement} canvas Reused between renders to avoid GC churn.
 * @param {import('@/products/schema').ProductPrintConfig} print
 * @param {object|null} artwork Result of `loadArtwork`, or null for bare stock.
 * @param {object} transform
 * @param {{ transparentBackground?: boolean, stockColor?: string }} [options]
 */
export function composeArtwork(canvas, print, artwork, transform, options = {}) {
  const { texture } = print;
  if (canvas.width !== texture.width) canvas.width = texture.width;
  if (canvas.height !== texture.height) canvas.height = texture.height;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!options.transparentBackground) {
    ctx.fillStyle = options.stockColor ?? print.stockColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!artwork) return canvas;

  const rect = getPrintRect(print);
  const box = getArtworkBox(print, artwork, transform);

  ctx.save();
  // Nothing may print outside the printable window.
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const repeat = Math.max(1, Math.round(transform.repeat ?? 1));

  if (repeat > 1) {
    const step = rect.width / repeat;
    for (let i = 0; i < repeat; i += 1) {
      const offset = -rect.width / 2 + step / 2 + i * step;
      drawPlacement(ctx, artwork, box, transform, offset);
    }
  } else {
    drawPlacement(ctx, artwork, box, transform, 0);
  }

  // On a wrapping surface the left and right edges are the same seam, so any
  // artwork crossing an edge has to reappear on the other side.
  if (print.wrap) {
    const crossesLeft = box.x < rect.x;
    const crossesRight = box.x + box.width > rect.x + rect.width;
    if (crossesLeft) drawPlacement(ctx, artwork, box, transform, rect.width);
    if (crossesRight) drawPlacement(ctx, artwork, box, transform, -rect.width);
  }

  ctx.restore();
  return canvas;
}

export default composeArtwork;
