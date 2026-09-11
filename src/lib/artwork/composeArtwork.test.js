import { describe, expect, it } from 'vitest';
import {
  getArtworkBox,
  getFitScale,
  getPrintRect,
  getSafeRect,
} from './composeArtwork';

/**
 * Geometry tests for the compositor.
 *
 * Only the pure helpers are covered here — they resolve a product's print
 * configuration and a transform into pixel rectangles, and every visible
 * placement in the studio is downstream of them. `composeArtwork` itself needs
 * a real canvas, so it is verified visually rather than here.
 *
 * The fixtures are the paper cup's and the mailer package's real numbers. They
 * are not illustrative: the ratio between their texture pixels and their
 * declared millimetres is the subject of one of the tests below.
 */

/** Paper cup — a wrapping surface with a printable band inside its UV space. */
const CUP = {
  mode: 'texture',
  texture: { width: 2560, height: 1024 },
  uv: { x: 0, y: 0.06, width: 1, height: 0.8 },
  physical: { widthMm: 250, heightMm: 92, bleedMm: 3, safeMm: 5 },
  wrap: true,
  stockColor: '#f7f5f1',
};

/** Mailer package — a flat panel, and the worst pixel-to-millimetre mismatch. */
const MAILER = {
  mode: 'decal',
  texture: { width: 1600, height: 2048 },
  uv: { x: 0, y: 0, width: 1, height: 1 },
  physical: { widthMm: 180, heightMm: 300, bleedMm: 3, safeMm: 8 },
  wrap: false,
  stockColor: '#c8ab84',
};

const SQUARE = { aspect: 1, width: 1000, height: 1000 };
const IDENTITY = { scale: 0.42, x: 0, y: 0, rotation: 0, repeat: 1 };

describe('getPrintRect', () => {
  it('resolves the UV window into texture pixels', () => {
    expect(getPrintRect(CUP)).toEqual({ x: 0, y: 61, width: 2560, height: 819 });
  });

  it('spans the whole texture when the UV window is the full square', () => {
    expect(getPrintRect(MAILER)).toEqual({ x: 0, y: 0, width: 1600, height: 2048 });
  });
});

describe('getSafeRect', () => {
  it('insets the print rect by the safe margin, converted from millimetres', () => {
    const safe = getSafeRect(CUP);
    // 5 mm of 250 mm across, 5 mm of 92 mm down.
    expect(safe.x).toBeCloseTo(51.2, 3);
    expect(safe.width).toBeCloseTo(2457.6, 3);
    expect(safe.y).toBeCloseTo(105.511, 3);
    expect(safe.height).toBeCloseTo(729.978, 3);
  });

  it('stays inside the print rect on every edge', () => {
    const rect = getPrintRect(MAILER);
    const safe = getSafeRect(MAILER);
    expect(safe.x).toBeGreaterThan(rect.x);
    expect(safe.y).toBeGreaterThan(rect.y);
    expect(safe.x + safe.width).toBeLessThan(rect.x + rect.width);
    expect(safe.y + safe.height).toBeLessThan(rect.y + rect.height);
  });
});

describe('getArtworkBox', () => {
  it('sizes the artwork as a fraction of the print area width', () => {
    const box = getArtworkBox(CUP, SQUARE, IDENTITY);
    expect(box.width).toBeCloseTo(2560 * 0.42, 6);
  });

  it('centres an unoffset placement in the print area', () => {
    const box = getArtworkBox(CUP, SQUARE, IDENTITY);
    expect(box.centreX).toBeCloseTo(1280, 6);
    expect(box.centreY).toBeCloseTo(61 + 819 / 2, 6);
  });

  it('reads offsets as halves of the print area, so ±1 reaches the edge', () => {
    const box = getArtworkBox(CUP, SQUARE, { ...IDENTITY, x: 1, y: -1 });
    expect(box.centreX).toBeCloseTo(1280 + 1280, 6);
    expect(box.centreY).toBeCloseTo(61 + 819 / 2 - 819 / 2, 6);
  });

  it('accounts for a crop when working out the drawn aspect', () => {
    // Half as tall a crop of a square source is twice as wide as it is high.
    const cropped = { ...IDENTITY, crop: { x: 0, y: 0.25, width: 1, height: 0.5 } };
    const box = getArtworkBox(CUP, SQUARE, cropped);
    expect(box.width / box.height).toBeCloseTo(2, 6);
  });

  it('clamps scale to the compositor bounds', () => {
    const huge = getArtworkBox(CUP, SQUARE, { ...IDENTITY, scale: 99 });
    expect(huge.width).toBeCloseTo(2560 * 3, 6);
  });
});

describe('getFitScale', () => {
  it('contains a square inside the print area height', () => {
    expect(getFitScale(CUP, SQUARE, IDENTITY, 'contain')).toBeCloseTo(819 / 2560, 6);
  });

  it('never scales past full width when containing', () => {
    const tall = { aspect: 0.1, width: 100, height: 1000 };
    expect(getFitScale(CUP, tall, IDENTITY, 'contain')).toBeLessThanOrEqual(1);
  });

  it('never scales below full width when covering', () => {
    expect(getFitScale(CUP, SQUARE, IDENTITY, 'cover')).toBeGreaterThanOrEqual(1);
  });
});

/**
 * Known defect, scheduled for the millimetre-space refactor.
 *
 * Placement resolves in texture pixels, but a texture's pixel aspect is
 * declared independently of the product's physical aspect — so the two disagree,
 * and the disagreement is a non-uniform scale. A square logo composites to a
 * square *pixel* box, which is not a square on the finished product.
 *
 * Both products here sample more pixels per millimetre across than down, so a
 * square pixel box covers fewer millimetres horizontally than vertically: the
 * artwork prints **taller than it is wide**, by the margin each test names.
 *
 * The numbers are asserted deliberately, as the anchor the refactor has to
 * move: once placement is expressed in millimetres, every ratio here becomes 1.
 */
describe('pixels-per-millimetre (known non-uniform — see Phase 4)', () => {
  /** How much more densely the texture samples across than down. */
  const sampling = (print) => {
    const rect = getPrintRect(print);
    const perMmX = rect.width / print.physical.widthMm;
    const perMmY = rect.height / print.physical.heightMm;
    return perMmX / perMmY;
  };

  /** Printed aspect of a source that is square on disk. */
  const printedSquareAspect = (print) => {
    const box = getArtworkBox(print, SQUARE, IDENTITY);
    const rect = getPrintRect(print);
    const widthMm = box.width / (rect.width / print.physical.widthMm);
    const heightMm = box.height / (rect.height / print.physical.heightMm);
    return widthMm / heightMm;
  };

  it('over-samples the paper cup across by ~15%', () => {
    expect(sampling(CUP)).toBeCloseTo(1.1503, 3);
  });

  it('over-samples the mailer package across by ~30%', () => {
    expect(sampling(MAILER)).toBeCloseTo(1.3021, 3);
  });

  it('draws a square source as a square in pixels', () => {
    const box = getArtworkBox(MAILER, SQUARE, IDENTITY);
    expect(box.width / box.height).toBeCloseTo(1, 6);
  });

  it('prints that square ~13% taller than wide on the cup', () => {
    expect(printedSquareAspect(CUP)).toBeCloseTo(0.8694, 3);
  });

  it('prints that square ~23% taller than wide on the mailer package', () => {
    expect(printedSquareAspect(MAILER)).toBeCloseTo(0.768, 3);
  });
});
