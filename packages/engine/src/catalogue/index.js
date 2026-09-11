/**
 * Build a catalogue from product configurations.
 *
 * This module used to export the catalogue itself — a module-level array of
 * INMORE's four products, with `getProduct`, `defaultProductId` and friends
 * reading from it. That works exactly once: a module singleton means one
 * client, and it means two studios on the same page necessarily show the same
 * products.
 *
 * So a catalogue is now a value you construct. The application decides which
 * products exist and hands the result to whatever needs it. Nothing below
 * this line knows about any particular client.
 *
 * Construction is also where stock ids are resolved. A product config names
 * its stocks — `'natural'`, `'slate'` — rather than embedding hexes, because
 * which board a client can actually print on is the client's business, not the
 * product's. The resolved palette is written back onto the product in the
 * shape the studio already expects, so nothing downstream changes.
 */

/**
 * @typedef {Object} Stock
 * @property {string} id
 * @property {string} color  Hex, as the board actually comes out.
 * @property {string} label  Fallback name; the locale bundle overrides by id.
 *
 * @typedef {Object} Catalogue
 * @property {import('./schema').ProductConfig[]} all       Every product, in order.
 * @property {import('./schema').ProductConfig[]} live      Those the studio can open.
 * @property {import('./schema').ProductConfig[]} showcase  Those the hero cycles through.
 * @property {string|undefined} defaultProductId
 * @property {Record<string, Stock>} stocks
 * @property {(id: string) => import('./schema').ProductConfig|undefined} get
 * @property {(slug: string) => import('./schema').ProductConfig|undefined} getBySlug
 * @property {(id: string) => boolean} isLive
 */

/**
 * A stock that is not in the table is a typo, and silence would ship it.
 *
 * The id is stamped on from the key rather than read out of the value. In a
 * config the key already says which stock this is, and asking for it twice is
 * an invitation to have the two disagree.
 */
function resolveStock(id, stocks, product) {
  const stock = stocks[id];
  if (!stock) {
    const known = Object.keys(stocks).join(', ') || 'none';
    throw new Error(
      `Product "${product.id}" names stock "${id}", which this tenant does not offer. Known stocks: ${known}.`
    );
  }
  return { ...stock, id };
}

/**
 * Resolve one product's stock references into the runtime shape.
 *
 * Announced-but-unbuilt products carry no print block at all, and are passed
 * through untouched — they exist to be listed, not to be opened.
 */
function resolveProduct(product, stocks) {
  if (!product.print) return product;

  const { stock, stockPalette, ...print } = product.print;

  const palette = (stockPalette ?? (stock ? [stock] : [])).map((id) =>
    resolveStock(id, stocks, product)
  );

  // The default stock is the named one, or the first the product offers.
  const base = stock ? resolveStock(stock, stocks, product) : palette[0];

  return {
    ...product,
    print: {
      ...print,
      stockColor: base?.color ?? '#f7f5f1',
      stockPalette: palette.length ? palette : undefined,
    },
  };
}

/**
 * @param {{ products?: any[], stocks?: Record<string, Stock> }} config
 * @returns {Catalogue}
 */
export function createCatalogue({ products = [], stocks = {} } = {}) {
  const all = products
    .map((product) => resolveProduct(product, stocks))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const live = all.filter((product) => product.status === 'live');

  return {
    all,
    live,
    /** The hero cycles through live products, in catalogue order. */
    showcase: live,
    defaultProductId: live[0]?.id,
    stocks,
    get: (id) => live.find((product) => product.id === id),
    getBySlug: (slug) => live.find((product) => product.slug === slug),
    isLive: (id) => live.some((product) => product.id === id),
  };
}

/**
 * Fields of a product whose value may differ by language.
 *
 * Everything else on a product — geometry, print area, camera, materials — is
 * the same object in every language, because it describes one physical thing.
 */
const LOCALIZED_FIELDS = ['name', 'shortName', 'category', 'summary', 'specs', 'guidance'];

/**
 * Resolve a product's display strings for the active locale.
 *
 * Each localizable field is either one value used everywhere or a map of
 * locale to value. The second shape used to be a single `translations` block
 * holding a whole language at once; per-field maps replaced it when configs
 * became JSON, because a validator can then say exactly which field in which
 * language is missing rather than "a translation block is incomplete" — and it
 * matches how stock labels already worked.
 *
 * A field with no value for the requested language falls back rather than
 * disappearing: a half-translated config should read oddly, not break.
 */
export function localizeProduct(product, locale, fallback = 'en') {
  if (!product) return product;

  let changed = false;
  const out = { ...product };

  for (const field of LOCALIZED_FIELDS) {
    const value = product[field];
    if (value == null || typeof value === 'string' || Array.isArray(value)) continue;
    if (typeof value !== 'object') continue;

    out[field] = value[locale] ?? value[fallback] ?? Object.values(value)[0];
    changed = true;
  }

  return changed ? out : product;
}

/**
 * The stock palette a product offers, falling back to its single stock.
 *
 * Pure — it reads the product it is given and nothing else, so it needs no
 * catalogue and is safe to call from anywhere.
 */
export function paletteFor(product) {
  return (
    product?.print?.stockPalette ?? [
      { id: 'stock', color: product?.print?.stockColor ?? '#f7f5f1', label: 'Stock' },
    ]
  );
}

export default createCatalogue;
