import { clamp } from '../utils/math';
import { IDENTITY_CROP } from './constants';

/**
 * Text as artwork.
 *
 * The compositor places one kind of thing: a box with an aspect ratio, at a
 * width in millimetres, rotated about its centre. Uploaded artwork is such a
 * box because it is a bitmap; text is such a box because it can be *measured*.
 * So a text layer is turned into the same shape of object the compositor
 * already takes — `{ aspect, draw }` in place of `{ aspect, source }` — and
 * placement, rotation, repeat, seam wrapping, dragging, the 3D texture and the
 * press proof all work on it without knowing it is text.
 *
 * ## Vector at every resolution
 *
 * Text is never rasterised to an intermediate bitmap. `draw` is handed the
 * finished box in whatever pixels the caller works in — 200 dpi for the
 * screen, 300 for the proof — and sets the type at that size. A proof
 * therefore carries crisp letterforms, not an enlarged screen texture.
 *
 * ## Size is a consequence of width
 *
 * A placement has a width in millimetres and the box's aspect ratio decides
 * the height. For text the aspect comes from measuring it, and the font size
 * falls out: the type is scaled until the widest line is exactly as wide as
 * the box. Editing the words keeps the *height* still (see `retuneWidth`) so
 * typing a longer line does not shrink the letters.
 */

/** The size text is measured at. Only ratios of it are ever used. */
export const REFERENCE_SIZE = 100;

/** Line pitch as a multiple of font size. Fixed, and reported in the payload. */
export const LINE_HEIGHT = 1.2;

export const TEXT_ALIGNMENTS = ['left', 'center', 'right'];

const RTL_PATTERN = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** True when a string contains characters from a right-to-left script. */
export const isRtlText = (value = '') => RTL_PATTERN.test(value);

export const linesOf = (content = '') => {
  const lines = String(content).replace(/\r\n?/g, '\n').split('\n');
  return lines.length ? lines : [''];
};

let sharedContext;

/** One measuring context for the page. `null` where there is no 2D canvas. */
function measuringContext() {
  if (sharedContext !== undefined) return sharedContext;
  try {
    sharedContext = document.createElement('canvas').getContext('2d') ?? null;
  } catch {
    sharedContext = null;
  }
  return sharedContext;
}

/** The CSS `font` shorthand for a font descriptor at a pixel size. */
export function fontCss(font, px) {
  return `${font.style ?? 'normal'} ${font.weight ?? 400} ${px}px ${font.stack ?? font.family}`;
}

/**
 * Measure a block of text at the reference size.
 *
 * Falls back to a width estimate where there is no canvas — a test
 * environment, or a browser that refuses one — so a layer always has an
 * aspect and the rest of the studio never has to ask whether it does.
 */
export function measureText(content, font, context = measuringContext()) {
  const lines = linesOf(content);
  const blockHeight = lines.length * LINE_HEIGHT * REFERENCE_SIZE;

  let widest;
  if (context) {
    context.font = fontCss(font, REFERENCE_SIZE);
    widest = Math.max(
      ...lines.map((line) => {
        context.direction = isRtlText(line) ? 'rtl' : 'ltr';
        return context.measureText(line).width;
      })
    );
  } else {
    widest = Math.max(...lines.map((line) => line.length)) * REFERENCE_SIZE * 0.55;
  }

  const blockWidth = Math.max(widest, REFERENCE_SIZE * 0.1);
  return { lines, blockWidth, blockHeight, aspect: blockWidth / blockHeight };
}

/**
 * A text layer as something the compositor can place.
 *
 * @param {{ content: string, color: string, align?: 'left'|'center'|'right' }} layer
 * @param {object} font A resolved font descriptor (see the catalogue).
 * @param {CanvasRenderingContext2D|null} [context] For tests.
 */
export function createTextArtwork(layer, font, context) {
  const { lines, blockWidth, blockHeight, aspect } = measureText(layer.content, font, context);
  const align = layer.align ?? 'center';

  return {
    kind: 'text',
    id: layer.id,
    name: layer.content,
    aspect,
    // Reference-size dimensions, so nothing mistakes them for pixels.
    width: blockWidth,
    height: blockHeight,
    crop: IDENTITY_CROP,
    isLowResolution: false,
    objectUrl: null,
    source: null,

    /**
     * Set the type into a box `w` × `h` whose centre is the origin. The caller
     * has already translated and rotated.
     */
    draw(ctx, w, h) {
      const px = REFERENCE_SIZE * (w / blockWidth);
      const pitch = LINE_HEIGHT * px;
      const x = align === 'left' ? -w / 2 : align === 'right' ? w / 2 : 0;

      ctx.save();
      ctx.font = fontCss(font, px);
      ctx.fillStyle = layer.color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = align;
      lines.forEach((line, index) => {
        ctx.direction = isRtlText(line) ? 'rtl' : 'ltr';
        ctx.fillText(line, x, -h / 2 + pitch * (index + 0.5));
      });
      ctx.restore();
    },
  };
}

/** Font size in millimetres for a placed layer — what a press operator asks for. */
export function fontSizeMm(transform, aspect, lineCount) {
  const heightMm = transform.widthMm / aspect;
  return heightMm / (Math.max(1, lineCount) * LINE_HEIGHT);
}

/**
 * Where a new text layer lands.
 *
 * Sized so the type reads at once without swamping the panel — about 60% of
 * the width, but never taller than half the height, which is what a
 * three-line block would otherwise do. Layers after the first are staggered
 * so they do not open stacked on top of each other.
 */
const SLOTS = [0, 0.5, -0.5, 0.8];

export function defaultTextTransform(print, aspect, index = 0) {
  const { widthMm, heightMm } = print.physical;
  const width = Math.min(widthMm * 0.6, heightMm * 0.5 * aspect);
  return {
    widthMm: width,
    xMm: 0,
    yMm: SLOTS[index % SLOTS.length] * (heightMm / 2),
    rotation: 0,
    repeat: 1,
    crop: IDENTITY_CROP,
  };
}

/**
 * The width that keeps a layer's letters the same size when its aspect ratio
 * changes — new words, or a different font. Held to the print area so a
 * long line does not run off it.
 */
export function retuneWidth(transform, oldAspect, newAspect, print) {
  const height = transform.widthMm / oldAspect;
  // Never wider than the print area: past that, the type shrinks to fit
  // rather than running off the edge. A visitor can still enlarge it by hand.
  return clamp(height * newAspect, print.physical.widthMm * 0.05, print.physical.widthMm);
}

/** Carry a placement from one print area to another, proportionally. */
export function refitTransform(transform, from, to) {
  const sx = to.physical.widthMm / from.physical.widthMm;
  const sy = to.physical.heightMm / from.physical.heightMm;
  return {
    ...transform,
    widthMm: transform.widthMm * sx,
    xMm: transform.xMm * sx,
    yMm: transform.yMm * sy,
  };
}

const luminance = (hex) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The palette colour that reads best on a stock. New text on white stock
 * should not open white; the visitor can change it, but the first thing they
 * see should be visible.
 */
export function bestOn(background, palette) {
  const options = palette.length ? palette : ['#111111', '#ffffff'];
  return options.reduce((best, colour) =>
    contrastRatio(colour, background) > contrastRatio(best, background) ? colour : best
  );
}
