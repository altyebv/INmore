import { describe, expect, it, vi } from 'vitest';
import {
  assertValidTenantConfig,
  normaliseTenantConfig,
  validateTenantConfig,
} from './index';

/**
 * The validator.
 *
 * Its job is not really to say yes or no — a config that is wrong will fail
 * somewhere regardless. Its job is to say *where*, in words someone editing
 * JSON at midnight can act on. So most of these tests assert the path and the
 * wording of a message, not merely that something was rejected.
 */

/** The smallest config that should pass. Tests break it one field at a time. */
const base = () => ({
  tenant: 'acme',
  locales: ['en'],
  stocks: { white: { color: '#ffffff', label: 'White' } },
  products: [
    {
      id: 'cup',
      slug: 'cup',
      status: 'live',
      name: 'Cup',
      model: { url: 'models/cup.glb', heightM: 0.11, printMeshName: 'Body' },
      print: {
        mode: 'texture',
        physical: { widthMm: 250, heightMm: 92, bleedMm: 3, safeMm: 5 },
        stock: 'white',
        stockPalette: ['white'],
        defaultTransform: { width: 0.4, x: 0, y: 0 },
      },
    },
  ],
});

const errorsAt = (config, path) =>
  validateTenantConfig(config).errors.filter((e) => e.path === path);

const messageAt = (config, path) => errorsAt(config, path)[0]?.message ?? '';

describe('a sound config', () => {
  it('passes', () => {
    const result = validateTenantConfig(base());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('passes with nothing optional supplied', () => {
    const config = base();
    delete config.products[0].print.defaultTransform;
    delete config.products[0].print.stockPalette;
    delete config.products[0].print.physical.bleedMm;
    expect(validateTenantConfig(config).valid).toBe(true);
  });
});

describe('the basics', () => {
  it('needs a tenant name', () => {
    const config = base();
    delete config.tenant;
    expect(messageAt(config, 'tenant')).toMatch(/non-empty string/);
  });

  it('needs at least one language', () => {
    const config = base();
    config.locales = [];
    expect(messageAt(config, 'locales')).toMatch(/at least one language/);
  });

  it('stops early without locales, rather than reporting noise', () => {
    const config = base();
    config.locales = [];
    // Everything else is checked against the locales, so the rest would be
    // unhelpful. One clear error beats forty derived ones.
    expect(validateTenantConfig(config).errors).toHaveLength(1);
  });

  it('rejects a default locale it does not speak', () => {
    const config = base();
    config.defaultLocale = 'fr';
    expect(messageAt(config, 'defaultLocale')).toMatch(/not in locales \[en\]/);
  });

  it('accepts an empty assetBase as "the page’s own origin"', () => {
    const config = base();
    config.assetBase = '';
    expect(validateTenantConfig(config).valid).toBe(true);
  });

  it('is not an object at all', () => {
    expect(validateTenantConfig(null).valid).toBe(false);
    expect(validateTenantConfig('nope').errors[0].message).toMatch(/must be an object/);
  });
});

describe('copy', () => {
  it('names the field and the language that is missing', () => {
    const config = base();
    config.locales = ['en', 'ar'];
    config.products[0].name = { en: 'Cup' };
    expect(messageAt(config, 'products[0].name.ar')).toMatch(
      /is missing, and "ar" is in this tenant's locales/
    );
  });

  it('accepts one string for every language', () => {
    const config = base();
    config.locales = ['en', 'ar'];
    config.products[0].name = 'Cup';
    expect(errorsAt(config, 'products[0].name')).toEqual([]);
  });

  it('requires a name but not a summary', () => {
    const config = base();
    delete config.products[0].name;
    delete config.products[0].summary;
    expect(messageAt(config, 'products[0].name')).toMatch(/is missing/);
    expect(errorsAt(config, 'products[0].summary')).toEqual([]);
  });
});

describe('stocks', () => {
  it('needs at least one', () => {
    const config = base();
    config.stocks = {};
    expect(messageAt(config, 'stocks')).toMatch(/at least one stock/);
  });

  it('rejects a colour that is not a colour', () => {
    const config = base();
    config.stocks.white.color = 'off-white';
    expect(messageAt(config, 'stocks.white.color')).toMatch(/not a hex colour/);
  });

  it('catches a product naming a stock the client does not offer', () => {
    const config = base();
    config.products[0].print.stock = 'kraftt';
    expect(messageAt(config, 'products[0].print.stock')).toMatch(
      /is "kraftt", which is not in stocks \[white\]/
    );
  });

  it('checks every entry of a palette, not just the first', () => {
    const config = base();
    config.products[0].print.stockPalette = ['white', 'nope'];
    expect(messageAt(config, 'products[0].print.stockPalette[1]')).toMatch(/is "nope"/);
  });
});

describe('products', () => {
  it('catches a duplicated id, and says which one', () => {
    const config = base();
    config.products.push({ ...config.products[0], slug: 'cup-2' });
    expect(messageAt(config, 'products[1].id')).toMatch(/duplicates products\[0\]\.id/);
  });

  it('catches a duplicated slug', () => {
    const config = base();
    config.products.push({ ...config.products[0], id: 'cup-2' });
    expect(messageAt(config, 'products[1].slug')).toMatch(/duplicates products\[0\]\.slug/);
  });

  it('asks nothing of a product the studio cannot open', () => {
    const config = base();
    config.products.push({ id: 'tote', slug: 'tote', status: 'coming-soon', name: 'Tote' });
    expect(validateTenantConfig(config).valid).toBe(true);
  });

  it('says why a live product needs geometry', () => {
    const config = base();
    delete config.products[0].model;
    expect(messageAt(config, 'products[0].model')).toMatch(/live product needs geometry/);
  });

  it('points at the tooling when a mesh name is missing', () => {
    const config = base();
    delete config.products[0].model.printMeshName;
    expect(messageAt(config, 'products[0].model.printMeshName')).toMatch(/models:inspect/);
  });

  it('rejects a model that is not a GLB', () => {
    const config = base();
    config.products[0].model.url = 'models/cup.obj';
    expect(messageAt(config, 'products[0].model.url')).toMatch(/loads \.glb files/);
  });

  it('explains that heightM is what the camera frames against', () => {
    const config = base();
    config.products[0].model.heightM = 0;
    expect(messageAt(config, 'products[0].model.heightM')).toMatch(/camera frames against/);
  });
});

describe('the print area', () => {
  it('says millimetres are the coordinate system', () => {
    const config = base();
    delete config.products[0].print.physical;
    expect(messageAt(config, 'products[0].print.physical')).toMatch(
      /coordinate system/
    );
  });

  it('requires a decal product to say which way the panel faces', () => {
    const config = base();
    config.products[0].print.mode = 'decal';
    expect(messageAt(config, 'products[0].print.projection')).toMatch(/models:axis/);
  });

  it('accepts a decal product that does', () => {
    const config = base();
    config.products[0].print.mode = 'decal';
    config.products[0].print.projection = { axis: 'z', up: 'y' };
    expect(validateTenantConfig(config).valid).toBe(true);
  });

  it('rejects a UV window outside 0–1', () => {
    const config = base();
    config.products[0].print.uv = { x: 0, y: 0, width: 1.5, height: 1 };
    expect(messageAt(config, 'products[0].print.uv.width')).toMatch(/between 0 and 1/);
  });

  /**
   * The check worth having. Safe margins wider than the print area produce a
   * negative safe rect: the guide inverts, the studio renders happily, and
   * nobody finds out until a proof comes back with artwork outside the area
   * that was guaranteed to print.
   */
  it('catches safe margins that leave nothing safe', () => {
    const config = base();
    config.products[0].print.physical.safeMm = { top: 5, right: 130, bottom: 5, left: 130 };
    expect(messageAt(config, 'products[0].print.physical.safeMm')).toMatch(
      /total 260 mm on a 250 mm print area, leaving nothing safe/
    );
  });

  it('catches it on the vertical axis too', () => {
    const config = base();
    config.products[0].print.physical.safeMm = 50; // 100 mm of a 92 mm height
    expect(messageAt(config, 'products[0].print.physical.safeMm')).toMatch(
      /total 100 mm on a 92 mm print area/
    );
  });

  it('accepts margins that do fit', () => {
    const config = base();
    config.products[0].print.physical.safeMm = { top: 7, right: 5, bottom: 5, left: 5 };
    expect(validateTenantConfig(config).valid).toBe(true);
  });
});

describe('the default placement', () => {
  it('rejects a width that is not a fraction of the print area', () => {
    const config = base();
    config.products[0].print.defaultTransform.width = 12;
    expect(messageAt(config, 'products[0].print.defaultTransform.width')).toMatch(
      /at most 3/
    );
  });

  it('rejects an offset beyond the edges', () => {
    const config = base();
    config.products[0].print.defaultTransform.x = 4;
    expect(messageAt(config, 'products[0].print.defaultTransform.x')).toMatch(
      /between -1 and 1/
    );
  });

  /** A config written before the millimetre refactor is legal but stale. */
  it('warns about a transform written in the old units', () => {
    const config = base();
    config.products[0].print.defaultTransform = { scale: 0.42 };
    const { valid, warnings } = validateTenantConfig(config);
    expect(valid).toBe(true);
    expect(warnings.some((w) => /not read any more/.test(w.message))).toBe(true);
  });
});

describe('branding', () => {
  it('warns rather than fails on a colour that is not hex', () => {
    const config = base();
    config.branding = { accent: 'rebeccapurple' };
    const { valid, warnings } = validateTenantConfig(config);
    expect(valid).toBe(true);
    expect(warnings[0].path).toBe('branding.accent');
  });

  it('rejects a raw token that is not a custom property', () => {
    const config = base();
    config.branding = { tokens: { accent: '#fff' } };
    expect(messageAt(config, 'branding.tokens.accent')).toMatch(/starting with "--"/);
  });
});

describe('reporting', () => {
  it('collects every problem rather than stopping at the first', () => {
    const config = base();
    delete config.tenant;
    delete config.products[0].model;
    config.products[0].print.stock = 'nope';

    const paths = validateTenantConfig(config).errors.map((e) => e.path);
    expect(paths).toContain('tenant');
    expect(paths).toContain('products[0].model');
    expect(paths).toContain('products[0].print.stock');
  });

  it('throws with every problem named and located', () => {
    const config = base();
    delete config.tenant;
    config.products[0].print.stock = 'nope';

    expect(() => assertValidTenantConfig(config, { label: 'acme.json' })).toThrow(
      /acme\.json is not a valid tenant config — 2 problems/
    );
    expect(() => assertValidTenantConfig(config)).toThrow(/products\[0\]\.print\.stock/);
  });

  it('returns the normalised config when it is sound', () => {
    const result = assertValidTenantConfig(base());
    expect(result.defaultLocale).toBe('en');
    expect(result.assetBase).toBe('');
    expect(result.products[0].order).toBe(999);
  });

  it('reports warnings without failing', () => {
    const quiet = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const config = base();
      config.branding = { accent: 'rebeccapurple' };
      expect(() => assertValidTenantConfig(config)).not.toThrow();
      expect(quiet).toHaveBeenCalled();
    } finally {
      quiet.mockRestore();
    }
  });
});

describe('normaliseTenantConfig', () => {
  it('fills in what was left unsaid without inventing content', () => {
    const config = normaliseTenantConfig({ tenant: 'acme', locales: ['en', 'ar'] });
    expect(config.defaultLocale).toBe('en');
    expect(config.branding).toEqual({});
    expect(config.stocks).toEqual({});
    expect(config.products).toEqual([]);
  });

  it('defaults a product to live, so a config can stay terse', () => {
    const config = normaliseTenantConfig({ products: [{ id: 'x' }] });
    expect(config.products[0].status).toBe('live');
  });
});
