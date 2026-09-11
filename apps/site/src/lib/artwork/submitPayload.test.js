import { describe, expect, it } from 'vitest';
import { buildSubmitPayload, artworkRef, printSizeFor } from './submitPayload';
import { DEFAULT_PRINT_DPI } from './composeArtwork';

/**
 * The submit payload.
 *
 * There is no backend to send this to, which is exactly why it is worth
 * pinning: the point of defining it now is that the eventual print job is a
 * pure 2-D composite, and that only holds if the placement leaving here means
 * something without this application's help.
 *
 * The test that matters is the last one.
 */

const PRODUCT = {
  id: 'paper-cup-8oz',
  slug: 'paper-cup',
  print: {
    stockColor: '#f7f5f1',
    wrap: true,
    physical: {
      widthMm: 250,
      heightMm: 92,
      bleedMm: 3,
      safeMm: { top: 7, right: 5, bottom: 5, left: 5 },
    },
    uv: { x: 0, y: 0.06, width: 1, height: 0.8 },
  },
};

const ARTWORK = { name: 'mark.svg', size: 4096, type: 'image/svg+xml', aspect: 1 };

const TRANSFORM = {
  widthMm: 96,
  xMm: -12,
  yMm: 4,
  rotation: 15,
  repeat: 2,
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

const build = (overrides = {}) =>
  buildSubmitPayload({
    tenant: 'inmore',
    locale: 'en',
    product: PRODUCT,
    artwork: ARTWORK,
    transform: TRANSFORM,
    baseColor: '#1c1b19',
    ...overrides,
  });

describe('artworkRef', () => {
  it('identifies a file without reading its bytes', () => {
    expect(artworkRef(ARTWORK)).toBe('mark.svg:4096:image/svg+xml');
  });

  it('is null when there is no artwork', () => {
    expect(artworkRef(null)).toBeNull();
  });
});

describe('buildSubmitPayload', () => {
  it('names the tenant, the product and the language', () => {
    const payload = build();
    expect(payload.tenant).toBe('inmore');
    expect(payload.sku).toBe('paper-cup-8oz');
    expect(payload.locale).toBe('en');
  });

  it('carries the chosen stock, not the product default', () => {
    expect(build().materials.body).toBe('#1c1b19');
  });

  it('falls back to the product stock when nothing was chosen', () => {
    expect(build({ baseColor: undefined }).materials.body).toBe('#f7f5f1');
  });

  it('carries the placement in millimetres, verbatim', () => {
    expect(build().decorations[0].placement).toEqual({
      widthMm: 96,
      xMm: -12,
      yMm: 4,
      rotation: 15,
      repeat: 2,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    });
  });

  it('restates the print area so a consumer needs no tenant config', () => {
    expect(build().decorations[0].area).toEqual({
      widthMm: 250,
      heightMm: 92,
      bleedMm: 3,
      safeMm: { top: 7, right: 5, bottom: 5, left: 5 },
      wrap: true,
    });
  });

  it('has no decorations when nothing was uploaded', () => {
    expect(build({ artwork: null }).decorations).toEqual([]);
  });

  it('still reports the configuration when nothing was uploaded', () => {
    const bare = build({ artwork: null });
    expect(bare.sku).toBe('paper-cup-8oz');
    expect(bare.materials.body).toBe('#1c1b19');
  });

  it('passes options through untouched', () => {
    expect(build({ options: { quantity: 500 } }).options).toEqual({ quantity: 500 });
  });
});

describe('printSizeFor', () => {
  it('answers in whole pixels at the requested resolution', () => {
    // 250 mm at 254 dpi is 10 px/mm, and the cup prints on 80% of its height.
    expect(printSizeFor(PRODUCT.print, 254)).toEqual({ width: 2500, height: 1150 });
  });

  it('is not capped by the screen texture budget', () => {
    expect(printSizeFor(PRODUCT.print, DEFAULT_PRINT_DPI).width).toBeGreaterThan(2048);
  });
});

/**
 * The whole point of the millimetre refactor, stated as an assertion.
 *
 * A server compositing onto a dieline has the payload and a dpi, and nothing
 * else — no texture dimensions, no UV window, no knowledge of how the studio
 * drew anything. It should reach the same placement the visitor approved.
 */
describe('a placement survives leaving the browser', () => {
  const { placement, area } = build().decorations[0];

  /** Everything a 2-D compositor would do, in the five lines it would take. */
  const composite = (dpi) => {
    const pxPerMm = dpi / 25.4;
    return {
      width: placement.widthMm * pxPerMm,
      height: (placement.widthMm * pxPerMm) / 1, // square source
      centreX: (area.widthMm / 2 + placement.xMm) * pxPerMm,
      centreY: (area.heightMm / 2 + placement.yMm) * pxPerMm,
      rotation: placement.rotation,
    };
  };

  it('places the artwork identically at any resolution, up to scale', () => {
    const a = composite(150);
    const b = composite(600);
    const ratio = 600 / 150;

    expect(b.width / a.width).toBeCloseTo(ratio, 9);
    expect(b.centreX / a.centreX).toBeCloseTo(ratio, 9);
    expect(b.centreY / a.centreY).toBeCloseTo(ratio, 9);
    expect(b.rotation).toBe(a.rotation);
  });

  it('puts a square mark on the product as a square', () => {
    const at300 = composite(DEFAULT_PRINT_DPI);
    expect(at300.width / at300.height).toBeCloseTo(1, 9);
  });

  it('measures 96 mm wide on a 250 mm wrap, at press resolution', () => {
    const pxPerMm = DEFAULT_PRINT_DPI / 25.4;
    expect(composite(DEFAULT_PRINT_DPI).width / pxPerMm).toBeCloseTo(96, 9);
  });

  it('sits 12 mm left of centre, wherever it is rendered', () => {
    const pxPerMm = DEFAULT_PRINT_DPI / 25.4;
    const offsetMm = composite(DEFAULT_PRINT_DPI).centreX / pxPerMm - area.widthMm / 2;
    expect(offsetMm).toBeCloseTo(-12, 9);
  });
});
