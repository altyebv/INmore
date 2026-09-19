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
 * @property {ReturnType<typeof resolveTextSettings>} text  Fonts, colours and limits for text.
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


/* --- Text ---------------------------------------------------------------------- */

/**
 * What a tenant with no `text` block gets: three system stacks. Enough for the
 * feature to work everywhere on day one; a client that cares which typefaces
 * its customers can choose declares its own.
 */
const BUILT_IN_FONTS = {
  sans: {
    label: { en: 'Sans', ar: 'بلا زوائد' },
    family: 'system-ui, "Segoe UI", Tahoma, Arial, sans-serif',
    weight: 700,
  },
  serif: {
    label: { en: 'Serif', ar: 'بزوائد' },
    family: 'Georgia, "Times New Roman", "Noto Naskh Arabic", serif',
    weight: 700,
  },
  mono: {
    label: { en: 'Mono', ar: 'أحادي' },
    family: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    weight: 700,
  },
};

const BUILT_IN_COLORS = ['#111111', '#ffffff', '#d62828', '#1d4ed8', '#15803d', '#f4b400'];

/** A short, stable hash, so two tenants' "inter" never share a registered name. */
function hashOf(value) {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function resolveFont(id, font) {
  const files = font.files ?? (font.url ? [{ url: font.url }] : []);
  const family = font.family ?? 'sans-serif';
  const name = `qs-${id}-${hashOf(files.map((file) => file.url).join('|') || family)}`;
  return {
    id,
    label: font.label ?? id,
    family,
    weight: font.weight ?? 400,
    style: font.style ?? 'normal',
    script: font.script,
    files,
    // The private name leads so a loaded face wins; the declared family follows
    // so text is still text if the file never arrives.
    name,
    stack: files.length ? `"${name}", ${family}` : family,
  };
}

/**
 * Resolve a tenant's `text` block into what the studio reads.
 *
 * Every field has a default, so a config that says nothing about text still
 * gets the feature. A tenant that does not want it says `enabled: false`; a
 * product that does not (a lid where text makes no sense) says `text: false`
 * on its print block.
 */
export function resolveTextSettings(text = {}) {
  const declared = text?.fonts && Object.keys(text.fonts).length ? text.fonts : BUILT_IN_FONTS;
  const fonts = Object.entries(declared).map(([id, font]) => resolveFont(id, font));
  const fallbackId = fonts[0]?.id;

  return {
    enabled: text?.enabled !== false,
    maxLength: text?.maxLength ?? 80,
    maxLayers: text?.maxLayers ?? 3,
    allowCustomColor: text?.allowCustomColor !== false,
    colors: text?.colors?.length ? text.colors : BUILT_IN_COLORS,
    defaultFont: fonts.some((font) => font.id === text?.defaultFont) ? text.defaultFont : fallbackId,
    fonts,
  };
}

/**
 * @param {{ products?: any[], stocks?: Record<string, Stock>, text?: object }} config
 * @returns {Catalogue}
 */
export function createCatalogue({ products = [], stocks = {}, text } = {}) {
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
    text: resolveTextSettings(text),
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
