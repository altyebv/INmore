import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRINT_DPI,
  MAX_TEXTURE_EDGE,
  getArtworkBox,
  getBleedRect,
  getFitWidthMm,
  getPrintRect,
  getSafeRect,
  normaliseSafe,
  resolveSurface,
} from './composeArtwork';

/**
 * Geometry tests for the compositor.
 *
 * Only the pure helpers are covered here — they resolve a product's print
 * configuration and a transform into pixel rectangles, and every visible
 * placement in the studio is downstream of them. `composeArtwork` itself needs
 * a real canvas, so it is verified visually rather than here.
 *
 * The fixtures are the paper cup's and the takeaway package's real numbers,
 * and they are chosen for one reason: those two products used to disagree with
 * themselves the most. The cup over-sampled across by 15% and the package by
 * 30%, which printed a square logo 13% and 23% taller than it was wide. The
 * last block asserts that both are now exactly 1.
 */

/** Paper cup — a wrapping surface with a printable band inside its UV space. */
const CUP = {
  mode: 'texture',
  uv: { x: 0, y: 0.06, width: 1, height: 0.8 },
  physical: {
    widthMm: 250,
    heightMm: 92,
    bleedMm: 3,
    safeMm: { top: 7, right: 5, bottom: 5, left: 5 },
  },
  wrap: true,
  stockColor: '#f7f5f1',
};

/** Takeaway package — a flat panel, and the worst offender of the two. */
const PACKAGE = {
  mode: 'decal',
  uv: { x: 0, y: 0, width: 1, height: 1 },
  physical: {
    widthMm: 180,
    heightMm: 300,
    bleedMm: 3,
    safeMm: { top: 8, right: 8, bottom: 8, left: 8 },
  },
  wrap: false,
  stockColor: '#c8ab84',
};

const SQUARE = { aspect: 1, width: 1000, height: 1000 };
const WIDE = { aspect: 2, width: 2000, height: 1000 };

/** A placement of a 100 mm-wide mark, dead centre. */
const CENTRED = { widthMm: 100, xMm: 0, yMm: 0, rotation: 0, repeat: 1 };

describe('normaliseSafe', () => {
  it('spreads one number across four edges', () => {
    expect(normaliseSafe(5)).toEqual({ top: 5, right: 5, bottom: 5, left: 5 });
  });

  it('keeps per-edge margins as given', () => {
    expect(normaliseSafe({ top: 7, right: 5, bottom: 5, left: 5 })).toEqual({
      top: 7,
      right: 5,
      bottom: 5,
      left: 5,
    });
  });

  it('treats a missing edge as no margin, not as undefined', () => {
    expect(normaliseSafe({ top: 4 })).toEqual({ top: 4, right: 0, bottom: 0, left: 0 });
  });

  it('survives no margins at all', () => {
    expect(normaliseSafe(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
});

describe('resolveSurface', () => {
  it('derives the texture from the print area, at the requested density', () => {
    const { pxPerMm, texture } = resolveSurface(PACKAGE, { dpi: 254 });
    expect(pxPerMm).toBeCloseTo(10, 6);
    expect(texture).toEqual({ width: 1800, height: 3000 });
  });

  it('sizes the texture to cover the whole UV space, not just the print area', () => {
    // The cup prints on 80% of its texture's height; the rest is stock.
    const { texture, trim } = resolveSurface(CUP, { dpi: 254 });
    expect(trim.height / texture.height).toBeCloseTo(0.8, 6);
    expect(trim.width / texture.width).toBeCloseTo(1, 6);
  });

  it('places the trim rect at the UV window origin', () => {
    const { texture, trim } = resolveSurface(CUP, { dpi: 254 });
    expect(trim.x).toBeCloseTo(0, 6);
    expect(trim.y).toBeCloseTo(0.06 * texture.height, 0);
  });

  it('lowers the density rather than exceed the texture budget', () => {
    const { texture, pxPerMm } = resolveSurface(PACKAGE);
    expect(Math.max(texture.width, texture.height)).toBeLessThanOrEqual(MAX_TEXTURE_EDGE);
    // Still uniform after the clamp — that is the point of clamping pxPerMm.
    expect(texture.width / texture.height).toBeCloseTo(180 / 300, 2);
    expect(pxPerMm).toBeGreaterThan(0);
  });

  it('never clamps a surface the press asked for', () => {
    const { texture } = resolveSurface(PACKAGE, { dpi: DEFAULT_PRINT_DPI });
    expect(Math.max(texture.width, texture.height)).toBeGreaterThan(MAX_TEXTURE_EDGE);
  });

  it('honours a config that asks for a particular render resolution', () => {
    const { dpi } = resolveSurface({ ...PACKAGE, renderDpi: 72 });
    expect(dpi).toBeCloseTo(72, 4);
  });
});

describe('rectangles', () => {
  it('insets the safe rect per edge', () => {
    const { pxPerMm } = resolveSurface(CUP);
    const trim = getPrintRect(CUP);
    const safe = getSafeRect(CUP);

    expect(safe.x - trim.x).toBeCloseTo(5 * pxPerMm, 6);
    expect(safe.y - trim.y).toBeCloseTo(7 * pxPerMm, 6);
    expect(safe.width).toBeCloseTo(trim.width - 10 * pxPerMm, 6);
    expect(safe.height).toBeCloseTo(trim.height - 12 * pxPerMm, 6);
  });

  it('expands the bleed rect outside the trim on every edge', () => {
    const { pxPerMm } = resolveSurface(CUP);
    const trim = getPrintRect(CUP);
    const bleed = getBleedRect(CUP);

    expect(trim.x - bleed.x).toBeCloseTo(3 * pxPerMm, 6);
    expect(bleed.width).toBeCloseTo(trim.width + 6 * pxPerMm, 6);
  });

  it('nests safe inside trim inside bleed', () => {
    const safe = getSafeRect(PACKAGE);
    const trim = getPrintRect(PACKAGE);
    const bleed = getBleedRect(PACKAGE);

    expect(bleed.x).toBeLessThan(trim.x);
    expect(trim.x).toBeLessThan(safe.x);
    expect(bleed.width).toBeGreaterThan(trim.width);
    expect(trim.width).toBeGreaterThan(safe.width);
  });

  it('gives the trim rect the print area aspect, on every product', () => {
    expect(getPrintRect(CUP).width / getPrintRect(CUP).height).toBeCloseTo(250 / 92, 6);
    expect(getPrintRect(PACKAGE).width / getPrintRect(PACKAGE).height).toBeCloseTo(
      180 / 300,
      6
    );
  });
});

describe('getArtworkBox', () => {
  it('sizes the artwork by its millimetre width', () => {
    const { pxPerMm } = resolveSurface(CUP);
    expect(getArtworkBox(CUP, SQUARE, CENTRED).width).toBeCloseTo(100 * pxPerMm, 6);
  });

  it('centres an unoffset placement in the print area', () => {
    const trim = getPrintRect(CUP);
    const box = getArtworkBox(CUP, SQUARE, CENTRED);
    expect(box.centreX).toBeCloseTo(trim.x + trim.width / 2, 6);
    expect(box.centreY).toBeCloseTo(trim.y + trim.height / 2, 6);
  });

  it('reads offsets as millimetres from that centre', () => {
    const { pxPerMm } = resolveSurface(CUP);
    const trim = getPrintRect(CUP);
    const box = getArtworkBox(CUP, SQUARE, { ...CENTRED, xMm: -20, yMm: 10 });

    expect(box.centreX).toBeCloseTo(trim.x + trim.width / 2 - 20 * pxPerMm, 6);
    expect(box.centreY).toBeCloseTo(trim.y + trim.height / 2 + 10 * pxPerMm, 6);
  });

  it('accounts for a crop when working out the drawn aspect', () => {
    // Half as tall a crop of a square source is twice as wide as it is high.
    const cropped = { ...CENTRED, crop: { x: 0, y: 0.25, width: 1, height: 0.5 } };
    const box = getArtworkBox(CUP, SQUARE, cropped);
    expect(box.width / box.height).toBeCloseTo(2, 6);
  });

  it('places the same millimetres identically whatever the render resolution', () => {
    const screen = getArtworkBox(CUP, SQUARE, CENTRED);
    const press = getArtworkBox(CUP, SQUARE, CENTRED, { dpi: DEFAULT_PRINT_DPI });

    const trim = getPrintRect(CUP);
    const pressTrim = getPrintRect(CUP, { dpi: DEFAULT_PRINT_DPI });

    // Same placement relative to the print area, at two different densities —
    // which is exactly what the server-side composite depends on.
    expect(screen.width / trim.width).toBeCloseTo(press.width / pressTrim.width, 6);
    expect((screen.centreX - trim.x) / trim.width).toBeCloseTo(
      (press.centreX - pressTrim.x) / pressTrim.width,
      6
    );
  });
});

describe('getFitWidthMm', () => {
  it('contains a square inside the print area height', () => {
    // The cup is 92 mm tall, so a square can be at most 92 mm wide.
    expect(getFitWidthMm(CUP, SQUARE, CENTRED, 'contain')).toBeCloseTo(92, 6);
  });

  it('never exceeds the print area width when containing', () => {
    // A 2:1 mark 300 mm tall would be 600 mm wide; the cup is 250 mm.
    expect(getFitWidthMm(CUP, WIDE, CENTRED, 'contain')).toBeCloseTo(184, 6);
    expect(getFitWidthMm(PACKAGE, WIDE, CENTRED, 'contain')).toBeCloseTo(180, 6);
  });

  it('fills the area when covering', () => {
    expect(getFitWidthMm(PACKAGE, SQUARE, CENTRED, 'cover')).toBeCloseTo(300, 6);
  });

  it('answers in millimetres a person could measure', () => {
    const fit = getFitWidthMm(PACKAGE, SQUARE, CENTRED, 'contain');
    expect(fit).toBeCloseTo(180, 6);
  });
});

/**
 * The defect this phase existed to remove.
 *
 * These four assertions used to hold the wrong numbers on purpose — 1.1503 and
 * 1.3021 sampling ratios, and printed aspects of 0.8694 and 0.768 for a source
 * that was square on disk. They were the anchor the refactor had to move, and
 * this is them moved.
 */
describe('millimetres are millimetres on both axes', () => {
  const sampling = (print) => {
    const { pxPerMm } = resolveSurface(print);
    const trim = getPrintRect(print);
    const perMmX = trim.width / print.physical.widthMm;
    const perMmY = trim.height / print.physical.heightMm;
    expect(perMmX).toBeCloseTo(pxPerMm, 6);
    return perMmX / perMmY;
  };

  const printedSquareAspect = (print, options) => {
    const box = getArtworkBox(print, SQUARE, CENTRED, options);
    const trim = getPrintRect(print, options);
    const widthMm = box.width / (trim.width / print.physical.widthMm);
    const heightMm = box.height / (trim.height / print.physical.heightMm);
    return widthMm / heightMm;
  };

  it.each([
    ['the paper cup', CUP],
    ['the takeaway package', PACKAGE],
  ])('samples %s at one density on both axes', (_name, print) => {
    expect(sampling(print)).toBeCloseTo(1, 9);
  });

  it.each([
    ['the paper cup', CUP],
    ['the takeaway package', PACKAGE],
  ])('prints a square source square on %s', (_name, print) => {
    expect(printedSquareAspect(print)).toBeCloseTo(1, 9);
  });

  it('prints it square at press resolution too', () => {
    expect(printedSquareAspect(PACKAGE, { dpi: DEFAULT_PRINT_DPI })).toBeCloseTo(1, 9);
  });

  it('keeps a non-square source at its own aspect', () => {
    const box = getArtworkBox(PACKAGE, WIDE, CENTRED);
    expect(box.width / box.height).toBeCloseTo(2, 9);
  });
});
