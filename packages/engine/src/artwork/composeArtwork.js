import { clamp, degToRad } from '../utils/math';
import { IDENTITY_CROP } from './constants';

/**
 * Turn an uploaded image plus a placement into the flat print layout.
 *
 * This module is the single place where artwork becomes pixels. It knows
 * nothing about React or Three.js — it takes a product's print configuration
 * and a transform, and returns a canvas. The 3D layer consumes that canvas as
 * a texture; the 2D preview draws the same canvas. One source of truth means
 * what the visitor arranges is exactly what appears on the product.
 *
 * ## Millimetres, not pixels
 *
 * Placement used to resolve in texture pixels, with the texture's dimensions
 * declared in each product config independently of that product's physical
 * size. The two disagreed — by 15% on the paper cup and 30% on the takeaway
 * package — and the disagreement was a non-uniform scale. A square logo
 * composited to a square *pixel* box, which is not a square on the finished
 * product: it printed 13% and 23% taller than it was wide. Nobody could see
 * it, because the same distorted texture fed both the 3D view and the flat
 * preview, and the two agreed with each other while both being wrong.
 *
 * So the physical print area is now the coordinate system. A config declares
 * millimetres; the texture's resolution is *derived* from them, so no one can
 * introduce a non-uniform scale by hand. One `pxPerMm` scalar converts, and it
 * is the same scalar on both axes — which is the whole fix. Rotation stops
 * shearing as a consequence rather than as a separate repair.
 *
 * It also means a placement is directly usable by a print composite later: a
 * transform of `{ widthMm: 96, xMm: -12, yMm: 4, rotation: 0 }` says the same
 * thing to a 2D compositor working on a dieline at 300 dpi as it does here.
 * That is the point. See `submitPayload.js`.
 */

const MM_PER_INCH = 25.4;

/** Resolution a surface is drawn at for the screen, unless a config says otherwise. */
export const DEFAULT_RENDER_DPI = 200;

/** Resolution the press wants. Only the export path asks for it. */
export const DEFAULT_PRINT_DPI = 300;

/**
 * Ceiling on a texture's longest edge.
 *
 * Not a quality judgement — a budget. Above this, mobile GPUs start refusing
 * or silently downsampling, and the artwork is redrawn on every drag frame.
 * Exceeding it lowers `pxPerMm` uniformly, so the geometry stays honest and
 * only the resolution gives.
 */
export const MAX_TEXTURE_EDGE = 2048;

export const mmToPx = (mm, pxPerMm) => mm * pxPerMm;
export const pxToMm = (px, pxPerMm) => px / pxPerMm;

const FULL_WINDOW = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Safe margins may be one number or one per edge. Per-edge is what a real
 * dieline needs — a cup's rim curl is not its base — and a single number is
 * the same thing said four times.
 */
export function normaliseSafe(safeMm) {
  if (safeMm == null) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof safeMm === 'number') {
    return { top: safeMm, right: safeMm, bottom: safeMm, left: safeMm };
  }
  return {
    top: safeMm.top ?? 0,
    right: safeMm.right ?? 0,
    bottom: safeMm.bottom ?? 0,
    left: safeMm.left ?? 0,
  };
}

/**
 * Resolve a print configuration into a pixel surface.
 *
 * Everything downstream — the canvas, the rectangles, the placement maths —
 * comes from here, so there is exactly one place where millimetres become
 * pixels and exactly one scalar doing it.
 *
 * `print.uv` is the window the printable area occupies inside the mesh's UV
 * space. The texture has to cover the whole of that space, not just the print
 * area, because what falls outside the window is stock and still gets drawn.
 *
 * @param {object} print
 * @param {{ dpi?: number }} [options] An explicit dpi is the press asking, and
 *   is never clamped to the screen's texture budget.
 */
export function resolveSurface(print, { dpi } = {}) {
  const { physical } = print;
  const uv = print.uv ?? FULL_WINDOW;

  const forPress = dpi != null;
  const targetDpi = dpi ?? print.renderDpi ?? DEFAULT_RENDER_DPI;

  let pxPerMm = targetDpi / MM_PER_INCH;
  let textureWidth = (physical.widthMm * pxPerMm) / uv.width;
  let textureHeight = (physical.heightMm * pxPerMm) / uv.height;

  if (!forPress) {
    const longest = Math.max(textureWidth, textureHeight);
    if (longest > MAX_TEXTURE_EDGE) {
      const fit = MAX_TEXTURE_EDGE / longest;
      pxPerMm *= fit;
      textureWidth *= fit;
      textureHeight *= fit;
    }
  }

  const texture = { width: Math.round(textureWidth), height: Math.round(textureHeight) };

  /** The trim line: the print area at its finished size. */
  const trim = {
    x: uv.x * textureWidth,
    y: uv.y * textureHeight,
    width: physical.widthMm * pxPerMm,
    height: physical.heightMm * pxPerMm,
  };

  const bleedPx = (physical.bleedMm ?? 0) * pxPerMm;
  const bleed = {
    x: trim.x - bleedPx,
    y: trim.y - bleedPx,
    width: trim.width + bleedPx * 2,
    height: trim.height + bleedPx * 2,
  };

  const safeMm = normaliseSafe(physical.safeMm);
  const safe = {
    x: trim.x + safeMm.left * pxPerMm,
    y: trim.y + safeMm.top * pxPerMm,
    width: trim.width - (safeMm.left + safeMm.right) * pxPerMm,
    height: trim.height - (safeMm.top + safeMm.bottom) * pxPerMm,
  };

  return { pxPerMm, dpi: pxPerMm * MM_PER_INCH, texture, trim, bleed, safe };
}

/** The trim rect in texture pixels — the print area at its finished size. */
export function getPrintRect(print, options) {
  return resolveSurface(print, options).trim;
}

/** The "guaranteed to print" rect, inset from trim by the safe margins. */
export function getSafeRect(print, options) {
  return resolveSurface(print, options).safe;
}

/** The rect artwork may cover, trim plus bleed. Only the press sees the difference. */
export function getBleedRect(print, options) {
  return resolveSurface(print, options).bleed;
}

/** Aspect of the source after its crop is applied. */
function croppedAspectOf(artwork, transform) {
  const crop = transform.crop ?? IDENTITY_CROP;
  return (artwork.aspect * crop.width) / crop.height;
}

/**
 * Resolve a transform into the placed artwork box, in texture pixels.
 *
 * Exported so the 2D preview can hit-test and drag without duplicating maths.
 * Both axes use the same `pxPerMm`, so what is square in millimetres is square
 * in pixels and square on the product.
 */
export function getArtworkBox(print, artwork, transform, options) {
  const { pxPerMm, trim } = resolveSurface(print, options);
  const aspect = croppedAspectOf(artwork, transform);

  const width = transform.widthMm * pxPerMm;
  const height = width / aspect;

  const centreX = trim.x + trim.width / 2 + transform.xMm * pxPerMm;
  const centreY = trim.y + trim.height / 2 + transform.yMm * pxPerMm;

  return { x: centreX - width / 2, y: centreY - height / 2, width, height, centreX, centreY };
}

/**
 * The artwork width, in millimetres, that fits the print area.
 *
 * `contain` fits it entirely inside; `cover` fills the area and lets the
 * overflow clip. Both are honest millimetre answers, so a visitor who asks to
 * fit the height gets artwork exactly as tall as the print area really is.
 */
export function getFitWidthMm(print, artwork, transform, mode = 'contain') {
  const { widthMm, heightMm } = print.physical;
  const aspect = croppedAspectOf(artwork, transform);
  const widthIfHeightFilled = heightMm * aspect;

  return mode === 'cover'
    ? Math.max(widthMm, widthIfHeightFilled)
    : Math.min(widthMm, widthIfHeightFilled);
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
 * @param {import('../catalogue/schema').ProductPrintConfig} print
 * @param {object|null} artwork Result of `loadArtwork`, or null for bare stock.
 * @param {object} transform
 * @param {{
 *   transparentBackground?: boolean,
 *   stockColor?: string,
 *   dpi?: number,
 *   bleed?: boolean,
 * }} [options]
 */
export function composeArtwork(canvas, print, artwork, transform, options = {}) {
  const surface = resolveSurface(print, options);
  const { texture, trim } = surface;

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

  /*
   * Bleed is a press concern, not a screen one. On the product the visitor is
   * looking at, artwork stops at the trim line — that is what the finished
   * object looks like. On the way to plate it may run into the bleed, because
   * that margin exists to absorb cutting tolerance. So the export asks for it
   * and the studio does not.
   */
  const window = options.bleed ? surface.bleed : trim;
  const box = getArtworkBox(print, artwork, transform, options);

  ctx.save();
  ctx.beginPath();
  ctx.rect(window.x, window.y, window.width, window.height);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const repeat = Math.max(1, Math.round(transform.repeat ?? 1));

  if (repeat > 1) {
    const step = trim.width / repeat;
    for (let i = 0; i < repeat; i += 1) {
      const offset = -trim.width / 2 + step / 2 + i * step;
      drawPlacement(ctx, artwork, box, transform, offset);
    }
  } else {
    drawPlacement(ctx, artwork, box, transform, 0);
  }

  // On a wrapping surface the left and right edges are the same seam, so any
  // artwork crossing an edge has to reappear on the other side.
  if (print.wrap) {
    const crossesLeft = box.x < trim.x;
    const crossesRight = box.x + box.width > trim.x + trim.width;
    if (crossesLeft) drawPlacement(ctx, artwork, box, transform, trim.width);
    if (crossesRight) drawPlacement(ctx, artwork, box, transform, -trim.width);
  }

  ctx.restore();
  return canvas;
}

export default composeArtwork;
