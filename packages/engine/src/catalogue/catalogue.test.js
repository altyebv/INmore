import { describe, expect, it } from 'vitest';
import { createCatalogue, paletteFor } from './index';

/**
 * The catalogue factory.
 *
 * These fixtures are deliberately not INMORE's products. The point of the
 * factory is that it has no opinion about which products exist, and a test
 * built on the real catalogue would not notice if that stopped being true.
 */

const STOCKS = {
  white: { id: 'white', color: '#ffffff', label: 'White' },
  kraft: { id: 'kraft', color: '#c8ab84', label: 'Kraft' },
  black: { id: 'black', color: '#111111', label: 'Black' },
};

const cup = {
  id: 'cup',
  slug: 'cup',
  status: 'live',
  order: 20,
  print: { stock: 'white', stockPalette: ['white', 'kraft'], wrap: true },
};

const box = {
  id: 'box',
  slug: 'box',
  status: 'live',
  order: 10,
  print: { stock: 'black', stockPalette: ['black', 'white'], wrap: false },
};

const soon = { id: 'tote', slug: 'tote', status: 'coming-soon', order: 30 };

describe('createCatalogue', () => {
  it('orders products by their declared order, not the order given', () => {
    const catalogue = createCatalogue({ products: [cup, box, soon], stocks: STOCKS });
    expect(catalogue.all.map((p) => p.id)).toEqual(['box', 'cup', 'tote']);
  });

  it('separates what the studio can open from what it can only list', () => {
    const catalogue = createCatalogue({ products: [cup, box, soon], stocks: STOCKS });
    expect(catalogue.live.map((p) => p.id)).toEqual(['box', 'cup']);
    expect(catalogue.all).toHaveLength(3);
  });

  it('opens on the first live product', () => {
    const catalogue = createCatalogue({ products: [cup, box, soon], stocks: STOCKS });
    expect(catalogue.defaultProductId).toBe('box');
  });

  it('looks products up by id and slug, and only live ones', () => {
    const catalogue = createCatalogue({ products: [cup, box, soon], stocks: STOCKS });
    expect(catalogue.get('cup').id).toBe('cup');
    expect(catalogue.getBySlug('box').id).toBe('box');
    expect(catalogue.get('tote')).toBeUndefined();
    expect(catalogue.isLive('tote')).toBe(false);
  });

  it('survives having no products at all', () => {
    const catalogue = createCatalogue();
    expect(catalogue.all).toEqual([]);
    expect(catalogue.defaultProductId).toBeUndefined();
  });
});

describe('stock resolution', () => {
  it('resolves the default stock id to a colour', () => {
    const catalogue = createCatalogue({ products: [cup], stocks: STOCKS });
    expect(catalogue.get('cup').print.stockColor).toBe('#ffffff');
  });

  it('resolves the palette ids to full stock objects, in order', () => {
    const catalogue = createCatalogue({ products: [box], stocks: STOCKS });
    expect(catalogue.get('box').print.stockPalette).toEqual([
      { id: 'black', color: '#111111', label: 'Black' },
      { id: 'white', color: '#ffffff', label: 'White' },
    ]);
  });

  it('leaves the rest of the print config untouched', () => {
    const catalogue = createCatalogue({ products: [cup], stocks: STOCKS });
    expect(catalogue.get('cup').print.wrap).toBe(true);
  });

  it('falls back to the first offered stock when no default is named', () => {
    const noDefault = { ...cup, print: { stockPalette: ['kraft', 'white'] } };
    const catalogue = createCatalogue({ products: [noDefault], stocks: STOCKS });
    expect(catalogue.get('cup').print.stockColor).toBe('#c8ab84');
  });

  it('passes through a product with no print block', () => {
    const catalogue = createCatalogue({ products: [soon], stocks: STOCKS });
    expect(catalogue.all[0]).toBe(soon);
  });

  it('names the product and the unknown stock when a config is wrong', () => {
    const typo = { ...cup, print: { stock: 'kraftt' } };
    expect(() => createCatalogue({ products: [typo], stocks: STOCKS })).toThrow(
      /Product "cup" names stock "kraftt"/
    );
  });

  it('lists the stocks that were available, to make the fix obvious', () => {
    const typo = { ...cup, print: { stock: 'nope' } };
    expect(() => createCatalogue({ products: [typo], stocks: STOCKS })).toThrow(
      /white, kraft, black/
    );
  });

  /**
   * The same product config, resolved against two different stock tables.
   * This is the property that makes stock tenant data rather than engine data.
   */
  it('gives one product different colours under different tenants', () => {
    const other = { white: { id: 'white', color: '#f0eae0', label: 'Ivory' } };
    const a = createCatalogue({ products: [cup], stocks: STOCKS });
    const b = createCatalogue({
      products: [{ ...cup, print: { stock: 'white', stockPalette: ['white'] } }],
      stocks: other,
    });

    expect(a.get('cup').print.stockColor).toBe('#ffffff');
    expect(b.get('cup').print.stockColor).toBe('#f0eae0');
  });
});

describe('paletteFor', () => {
  it('returns the resolved palette', () => {
    const catalogue = createCatalogue({ products: [cup], stocks: STOCKS });
    expect(paletteFor(catalogue.get('cup')).map((s) => s.id)).toEqual(['white', 'kraft']);
  });

  it('invents a single-stock palette for a product that offers no choice', () => {
    expect(paletteFor({ print: { stockColor: '#abcdef' } })).toEqual([
      { id: 'stock', color: '#abcdef', label: 'Stock' },
    ]);
  });

  it('does not throw on a product it knows nothing about', () => {
    expect(paletteFor(undefined)).toHaveLength(1);
  });
});

/**
 * Two catalogues built in the same process must not see each other. This is
 * trivially true of a factory and was impossible with the module-level array
 * it replaced, which is the entire reason for the change.
 */
describe('isolation', () => {
  it('keeps two catalogues independent', () => {
    const a = createCatalogue({ products: [cup], stocks: STOCKS });
    const b = createCatalogue({ products: [box, soon], stocks: STOCKS });

    expect(a.get('box')).toBeUndefined();
    expect(b.get('cup')).toBeUndefined();
    expect(a.defaultProductId).toBe('cup');
    expect(b.defaultProductId).toBe('box');
  });
});
