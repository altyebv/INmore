import { describe, expect, it } from 'vitest';
import { paletteFor, MAX_TEXTURE_EDGE, resolveSurface } from '@inmore/engine';
import { inmoreCatalogue } from './tenant';

/**
 * INMORE's own catalogue.
 *
 * `createCatalogue` is tested against invented fixtures, as it should be — it
 * has no opinion about which products exist. This file tests the opposite
 * thing: that the real configs, resolved through it, still come out as the
 * studio rendered them before stocks were ids.
 *
 * It earns its keep twice. It is the regression guard for the id refactor now,
 * and when this catalogue becomes `tenants/inmore.json` it is what proves the
 * JSON says the same thing the modules did.
 */

const ids = (products) => products.map((p) => p.id);
const paletteIds = (id) => paletteFor(inmoreCatalogue.get(id)).map((s) => s.id);

describe('the INMORE catalogue', () => {
  it('offers four products in the studio', () => {
    expect(ids(inmoreCatalogue.live)).toEqual([
      'paper-cup-8oz',
      'shopping-bag-paper',
      'gift-box-rigid',
      'takeaway-package',
    ]);
  });

  it('lists the announced ones too, so the range reads honestly', () => {
    expect(inmoreCatalogue.all.length).toBeGreaterThan(inmoreCatalogue.live.length);
    expect(inmoreCatalogue.all.every((p) => p.status)).toBe(true);
  });

  it('opens on the paper cup', () => {
    expect(inmoreCatalogue.defaultProductId).toBe('paper-cup-8oz');
  });

  it('cycles the live products through the hero', () => {
    expect(ids(inmoreCatalogue.showcase)).toEqual(ids(inmoreCatalogue.live));
  });
});

describe('stock resolution against the real configs', () => {
  it.each([
    ['paper-cup-8oz', '#f7f5f1', ['white', 'natural', 'sand', 'black', 'forest', 'clay']],
    ['shopping-bag-paper', '#c8ab84', ['natural', 'white', 'sand', 'black', 'forest', 'ink']],
    ['gift-box-rigid', '#5c6068', ['slate', 'black', 'white', 'clay', 'forest', 'ink']],
    ['takeaway-package', '#c8ab84', ['natural', 'white', 'sand', 'clay', 'forest', 'black']],
  ])('%s defaults to %s with its own palette', (id, color, palette) => {
    expect(inmoreCatalogue.get(id).print.stockColor).toBe(color);
    expect(paletteIds(id)).toEqual(palette);
  });

  it('gives every swatch a colour and a label', () => {
    for (const product of inmoreCatalogue.live) {
      for (const stock of paletteFor(product)) {
        expect(stock.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(stock.label).toBeTruthy();
      }
    }
  });
});

describe('every live product is renderable', () => {
  it.each(['paper-cup-8oz', 'shopping-bag-paper', 'gift-box-rigid', 'takeaway-package'])(
    '%s declares what the studio needs',
    (id) => {
      const { model, print, camera } = inmoreCatalogue.get(id);

      expect(model.url).toMatch(/\.glb$/);
      expect(model.heightM).toBeGreaterThan(0);
      expect(camera.position).toHaveLength(3);

      expect(print.physical.widthMm).toBeGreaterThan(0);
      expect(print.physical.heightMm).toBeGreaterThan(0);
      expect(print.defaultTransform.width).toBeGreaterThan(0);

      // Nothing declares a texture any more. The surface is derived from the
      // millimetres, which is what makes it impossible to declare a print area
      // whose pixels disagree with its physical shape.
      expect(print.texture).toBeUndefined();

      const surface = resolveSurface(print);
      expect(surface.texture.width).toBeGreaterThan(0);
      expect(Math.max(surface.texture.width, surface.texture.height)).toBeLessThanOrEqual(
        MAX_TEXTURE_EDGE
      );

      // The trim rect carries the product's real proportions, on every product.
      expect(surface.trim.width / surface.trim.height).toBeCloseTo(
        print.physical.widthMm / print.physical.heightMm,
        6
      );

      // A decal product builds its own print surface and needs to know which
      // way the panel faces; a texture product reads the authored UVs instead.
      if (print.mode === 'decal') expect(print.projection.axis).toBeTruthy();
    }
  );
});
