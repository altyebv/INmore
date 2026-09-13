/**
 * The tenant configuration contract.
 *
 * A tenant config is JSON: who the client is, what they print on, what
 * products they sell, and what the studio should look like in their hands.
 * Onboarding a client is writing one of these and uploading their models.
 *
 * This package has no dependencies, deliberately. Validating a config should
 * be possible from a build script, a CI check or an onboarding tool without
 * pulling in React and three.js — the thing you most want to check a config
 * with is the thing least able to afford a browser.
 *
 * It validates and normalises; it does not build a catalogue. Turning products
 * into something renderable is the engine's job, and the host does that in a
 * line once this has said the config is sound.
 *
 * @typedef {Object} ValidationError
 * @property {string} path     Where in the config, e.g. `products[2].print.physical.widthMm`.
 * @property {string} message  What is wrong, in words someone can act on.
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {ValidationError[]} errors
 * @property {ValidationError[]} warnings  Things that are legal but probably wrong.
 */

/* --- Typedefs for editors ---------------------------------------------------- */

/**
 * A string that may differ by language.
 *
 * Either one string used everywhere, or a map of locale to string. Both are
 * accepted because a config should be allowed to stay small: a board called
 * "Natural kraft" in every language has no business being written twice.
 *
 * @typedef {string | Record<string, string>} Localized
 *
 * @typedef {Object} Stock
 * @property {string} color     Hex, as the board actually comes out.
 * @property {Localized} label  What this client calls it.
 *
 * @typedef {Object} Branding
 * @property {string} [ink]
 * @property {string} [paper]
 * @property {string} [accent]
 * @property {string} [font]
 * @property {string} [fontMono]
 * @property {string} [fontArabic]
 * @property {string} [radius]
 * @property {string} [maxWidth]
 * @property {Record<string, string>} [tokens] Raw custom properties, applied last.
 *
 * @typedef {Object} StudioUi
 * @property {boolean} [picker=true] Whether the product picker is shown.
 *
 * @typedef {Object} TenantConfig
 * @property {string} tenant
 * @property {string[]} locales
 * @property {string} [defaultLocale]
 * @property {string} [assetBase]
 * @property {Branding} [branding]
 * @property {StudioUi} [ui]
 * @property {Record<string, Stock>} stocks
 * @property {object[]} products
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PRINT_MODES = ['texture', 'decal'];
const STATUSES = ['live', 'coming-soon'];

/** Fields whose value may be a `Localized` string. */
export const LOCALIZED_PRODUCT_FIELDS = ['name', 'shortName', 'category', 'summary'];

/** Fields that are lists of localizable content. */
export const LOCALIZED_PRODUCT_LISTS = ['guidance'];

/* --- Small helpers ----------------------------------------------------------- */

const isObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isString = (v) => typeof v === 'string' && v.length > 0;
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

class Collector {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  error(path, message) {
    this.errors.push({ path, message });
  }

  warn(path, message) {
    this.warnings.push({ path, message });
  }

  /** Assert a condition, recording the message if it does not hold. */
  check(condition, path, message) {
    if (!condition) this.error(path, message);
    return condition;
  }
}

/** Does a localizable value cover every language the tenant claims to speak? */
function checkLocalized(c, value, path, locales, { required = true } = {}) {
  if (value == null) {
    if (required) c.error(path, 'is missing.');
    return;
  }

  if (typeof value === 'string') {
    if (!value.length) c.error(path, 'is an empty string.');
    return;
  }

  if (!isObject(value)) {
    c.error(path, `must be a string or a map of locale to string, got ${typeof value}.`);
    return;
  }

  for (const locale of locales) {
    if (!isString(value[locale]) && !Array.isArray(value[locale])) {
      c.error(`${path}.${locale}`, `is missing, and "${locale}" is in this tenant's locales.`);
    }
  }
}

/* --- The validator ------------------------------------------------------------ */

/**
 * Check a tenant config.
 *
 * Returns everything that is wrong rather than stopping at the first problem:
 * someone fixing a config wants the whole list, not one error per run.
 *
 * @param {TenantConfig} config
 * @returns {ValidationResult}
 */
export function validateTenantConfig(config) {
  const c = new Collector();

  if (!isObject(config)) {
    c.error('', 'must be an object.');
    return { valid: false, errors: c.errors, warnings: c.warnings };
  }

  c.check(isString(config.tenant), 'tenant', 'must be a non-empty string identifying the client.');

  const locales = Array.isArray(config.locales) ? config.locales : [];
  if (!c.check(locales.length > 0, 'locales', 'must list at least one language, e.g. ["en"].')) {
    // Everything below checks copy against these; without them the rest of the
    // report would be noise.
    return { valid: false, errors: c.errors, warnings: c.warnings };
  }
  locales.forEach((locale, i) => {
    c.check(isString(locale), `locales[${i}]`, 'must be a language code.');
  });

  if (config.defaultLocale != null) {
    c.check(
      locales.includes(config.defaultLocale),
      'defaultLocale',
      `is "${config.defaultLocale}", which is not in locales [${locales.join(', ')}].`
    );
  }

  if (config.assetBase != null) {
    // An empty string is meaningful: resolve against the page's own origin,
    // which is what a tenant serving its own models from /public wants.
    c.check(
      typeof config.assetBase === 'string',
      'assetBase',
      'must be a URL or path prefix, or "" to resolve against the page’s own origin.'
    );
  }

  validateBranding(c, config.branding);
  validateUi(c, config.ui);
  const stockIds = validateStocks(c, config.stocks, locales);
  validateProducts(c, config.products, locales, stockIds);

  return { valid: c.errors.length === 0, errors: c.errors, warnings: c.warnings };
}

function validateBranding(c, branding) {
  if (branding == null) return;
  if (!isObject(branding)) {
    c.error('branding', 'must be an object.');
    return;
  }

  for (const key of ['ink', 'paper', 'accent']) {
    const value = branding[key];
    if (value == null) continue;
    if (!isString(value)) c.error(`branding.${key}`, 'must be a colour.');
    else if (!HEX.test(value)) {
      // Not an error: a tenant may legitimately use rgb() or a named colour.
      c.warn(`branding.${key}`, `is "${value}", which is not a hex colour. Intended?`);
    }
  }

  if (branding.tokens != null && !isObject(branding.tokens)) {
    c.error('branding.tokens', 'must be a map of custom property to value.');
  } else if (isObject(branding.tokens)) {
    for (const key of Object.keys(branding.tokens)) {
      if (!key.startsWith('--')) {
        c.error(`branding.tokens.${key}`, 'must be a CSS custom property, starting with "--".');
      }
    }
  }
}

function validateUi(c, ui) {
  if (ui == null) return;
  if (!isObject(ui)) {
    c.error('ui', 'must be an object.');
    return;
  }
  if (ui.picker != null && typeof ui.picker !== 'boolean') {
    c.error('ui.picker', 'must be a boolean.');
  }
}

function validateStocks(c, stocks, locales) {
  if (!isObject(stocks) || Object.keys(stocks).length === 0) {
    c.error('stocks', 'must name at least one stock the client can print on.');
    return new Set();
  }

  const ids = new Set();
  for (const [id, stock] of Object.entries(stocks)) {
    ids.add(id);
    const path = `stocks.${id}`;

    if (!isObject(stock)) {
      c.error(path, 'must be an object with a colour and a label.');
      continue;
    }
    if (!isString(stock.color)) c.error(`${path}.color`, 'is missing.');
    else if (!HEX.test(stock.color)) {
      c.error(`${path}.color`, `is "${stock.color}", which is not a hex colour.`);
    }
    checkLocalized(c, stock.label, `${path}.label`, locales);
  }
  return ids;
}

function validateProducts(c, products, locales, stockIds) {
  if (!Array.isArray(products) || products.length === 0) {
    c.error('products', 'must list at least one product.');
    return;
  }

  const seenIds = new Map();
  const seenSlugs = new Map();

  products.forEach((product, i) => {
    const path = `products[${i}]`;

    if (!isObject(product)) {
      c.error(path, 'must be an object.');
      return;
    }

    const label = isString(product.id) ? `products[${i}] ("${product.id}")` : path;

    if (!c.check(isString(product.id), `${path}.id`, 'is missing.')) return;
    if (seenIds.has(product.id)) {
      c.error(`${path}.id`, `duplicates products[${seenIds.get(product.id)}].id.`);
    }
    seenIds.set(product.id, i);

    if (isString(product.slug)) {
      if (seenSlugs.has(product.slug)) {
        c.error(`${path}.slug`, `duplicates products[${seenSlugs.get(product.slug)}].slug.`);
      }
      seenSlugs.set(product.slug, i);
    } else {
      c.error(`${path}.slug`, 'is missing.');
    }

    const status = product.status ?? 'live';
    c.check(
      STATUSES.includes(status),
      `${path}.status`,
      `is "${status}"; expected one of ${STATUSES.join(', ')}.`
    );

    for (const field of LOCALIZED_PRODUCT_FIELDS) {
      checkLocalized(c, product[field], `${path}.${field}`, locales, {
        required: field === 'name',
      });
    }
    for (const field of LOCALIZED_PRODUCT_LISTS) {
      if (product[field] != null) {
        checkLocalized(c, product[field], `${path}.${field}`, locales, { required: false });
      }
    }

    // A product the studio cannot open needs nothing but a name and a status.
    if (status !== 'live') return;

    validateModel(c, product.model, `${path}.model`, label);
    validateCamera(c, product.camera, `${path}.camera`);
    validatePrint(c, product.print, `${path}.print`, stockIds);
    validateMaterial(c, product.material, `${path}.material`);
  });
}

function validateMaterial(c, material, path) {
  if (!isObject(material)) {
    c.error(
      path,
      'is missing. A live product needs a material object — the engine reads it while shading the model, even if every field in it is left to its default.'
    );
    return;
  }

  for (const key of ['roughness', 'metalness', 'envMapIntensity']) {
    if (material[key] != null) {
      c.check(isNumber(material[key]), `${path}.${key}`, 'must be a number.');
    }
  }
}

function validateModel(c, model, path, label) {
  if (!isObject(model)) {
    c.error(path, `is missing, and ${label} is live. A live product needs geometry.`);
    return;
  }

  if (!c.check(isString(model.url), `${path}.url`, 'is missing.')) return;
  if (!/\.glb$/i.test(model.url)) {
    c.error(`${path}.url`, `is "${model.url}"; the studio loads .glb files.`);
  }
  if (/^https?:\/\//i.test(model.url)) {
    c.warn(
      `${path}.url`,
      'is an absolute URL, so assetBase will not apply to it. Intended for this one product?'
    );
  }

  c.check(
    isNumber(model.heightM) && model.heightM > 0,
    `${path}.heightM`,
    'must be the product’s real height in metres — it is what the camera frames against.'
  );
  c.check(
    isString(model.printMeshName),
    `${path}.printMeshName`,
    'is missing. Run `npm run models:inspect` to find the mesh or material name.'
  );

  for (const key of ['stockMeshes', 'hiddenMeshes']) {
    if (model[key] != null && !Array.isArray(model[key])) {
      c.error(`${path}.${key}`, 'must be a list of mesh or material names.');
    }
  }
}

function validateCamera(c, camera, path) {
  if (camera == null) return; // The engine has workable defaults.
  if (!isObject(camera)) {
    c.error(path, 'must be an object.');
    return;
  }
  if (camera.position != null) {
    c.check(
      Array.isArray(camera.position) && camera.position.length === 3,
      `${path}.position`,
      'must be three numbers — a viewing direction, not a distance. The distance is computed.'
    );
  }
  if (camera.fov != null) {
    c.check(isNumber(camera.fov) && camera.fov > 0, `${path}.fov`, 'must be a positive number.');
  }
}

function validatePrint(c, print, path, stockIds) {
  if (!isObject(print)) {
    c.error(path, 'is missing. A live product needs a print area.');
    return;
  }

  const mode = print.mode ?? 'texture';
  c.check(
    PRINT_MODES.includes(mode),
    `${path}.mode`,
    `is "${mode}"; expected one of ${PRINT_MODES.join(', ')}.`
  );

  if (mode === 'decal') {
    if (!isObject(print.projection)) {
      c.error(
        `${path}.projection`,
        'is missing. A decal product builds its own print surface and needs to know which way the panel faces — see `npm run models:axis`.'
      );
    } else if (!isString(print.projection.axis)) {
      c.error(`${path}.projection.axis`, 'is missing, e.g. "z" or "-y".');
    }
  }

  validatePhysical(c, print.physical, `${path}.physical`);

  if (print.uv != null) {
    for (const key of ['x', 'y', 'width', 'height']) {
      const value = print.uv[key];
      c.check(
        isNumber(value) && value >= 0 && value <= 1,
        `${path}.uv.${key}`,
        'must be between 0 and 1 — it is a fraction of the mesh’s UV space.'
      );
    }
  }

  for (const key of ['renderDpi', 'printDpi']) {
    if (print[key] != null) {
      c.check(isNumber(print[key]) && print[key] > 0, `${path}.${key}`, 'must be a positive number.');
    }
  }

  if (!isString(print.stock)) {
    c.error(`${path}.stock`, 'is missing. Name the default stock by id.');
  } else if (stockIds.size && !stockIds.has(print.stock)) {
    c.error(
      `${path}.stock`,
      `is "${print.stock}", which is not in stocks [${[...stockIds].join(', ')}].`
    );
  }

  if (print.stockPalette != null) {
    if (!Array.isArray(print.stockPalette)) {
      c.error(`${path}.stockPalette`, 'must be a list of stock ids.');
    } else {
      print.stockPalette.forEach((id, i) => {
        if (stockIds.size && !stockIds.has(id)) {
          c.error(
            `${path}.stockPalette[${i}]`,
            `is "${id}", which is not in stocks [${[...stockIds].join(', ')}].`
          );
        }
      });
    }
  }

  if (!isObject(print.defaultTransform)) {
    c.error(
      `${path}.defaultTransform`,
      'is missing. A live product needs a default placement — the engine reads it to seat the artwork before anything is uploaded.'
    );
  } else {
    validateDefaultTransform(c, print.defaultTransform, `${path}.defaultTransform`);
  }
}

function validatePhysical(c, physical, path) {
  if (!isObject(physical)) {
    c.error(
      path,
      'is missing. Millimetres are the studio’s coordinate system — without them nothing can be placed.'
    );
    return;
  }

  const width = physical.widthMm;
  const height = physical.heightMm;

  const hasWidth = c.check(
    isNumber(width) && width > 0,
    `${path}.widthMm`,
    'must be the finished width of the flat print area, in millimetres.'
  );
  const hasHeight = c.check(
    isNumber(height) && height > 0,
    `${path}.heightMm`,
    'must be the finished height of the flat print area, in millimetres.'
  );

  if (physical.bleedMm != null) {
    c.check(
      isNumber(physical.bleedMm) && physical.bleedMm >= 0,
      `${path}.bleedMm`,
      'must be zero or more millimetres.'
    );
  }

  const safe = physical.safeMm;
  if (safe == null) return;

  const edges =
    typeof safe === 'number'
      ? { top: safe, right: safe, bottom: safe, left: safe }
      : isObject(safe)
        ? safe
        : null;

  if (!edges) {
    c.error(`${path}.safeMm`, 'must be a number, or an object with top/right/bottom/left.');
    return;
  }

  for (const [edge, value] of Object.entries(edges)) {
    if (value == null) continue;
    if (!isNumber(value) || value < 0) {
      c.error(`${path}.safeMm.${edge}`, 'must be zero or more millimetres.');
    }
  }

  /*
   * The check worth having. Safe margins that exceed the print area leave a
   * negative safe rect — the guide inverts, the studio still renders, and
   * nobody notices until a proof comes back with the artwork outside the
   * guaranteed area.
   */
  if (hasWidth) {
    const across = (edges.left ?? 0) + (edges.right ?? 0);
    if (across >= width) {
      c.error(
        `${path}.safeMm`,
        `left and right margins total ${across} mm on a ${width} mm print area, leaving nothing safe to print in.`
      );
    }
  }
  if (hasHeight) {
    const down = (edges.top ?? 0) + (edges.bottom ?? 0);
    if (down >= height) {
      c.error(
        `${path}.safeMm`,
        `top and bottom margins total ${down} mm on a ${height} mm print area, leaving nothing safe to print in.`
      );
    }
  }
}

function validateDefaultTransform(c, transform, path) {
  if (transform.width != null) {
    c.check(
      isNumber(transform.width) && transform.width > 0 && transform.width <= 3,
      `${path}.width`,
      'is a fraction of the print area’s width, so it should be greater than 0 and at most 3.'
    );
  }
  for (const axis of ['x', 'y']) {
    if (transform[axis] != null) {
      c.check(
        isNumber(transform[axis]) && transform[axis] >= -1 && transform[axis] <= 1,
        `${path}.${axis}`,
        'is a fraction of half the print area, so it must be between -1 and 1.'
      );
    }
  }
  if (transform.scale != null) {
    c.warn(
      `${path}.scale`,
      'is not read any more. Placement is in millimetres now; use `width`, a fraction of the print area.'
    );
  }
}

/* --- Normalising -------------------------------------------------------------- */

/**
 * Fill in what a config left unsaid.
 *
 * Kept separate from validation so a config can be checked without being
 * changed — an onboarding tool wants to report on exactly what was written,
 * and the engine wants the version with the blanks filled.
 */
export function normaliseTenantConfig(config) {
  const locales = config.locales ?? ['en'];

  return {
    ...config,
    locales,
    defaultLocale: config.defaultLocale ?? locales[0],
    assetBase: config.assetBase ?? '',
    branding: config.branding ?? {},
    ui: { picker: true, ...config.ui },
    stocks: config.stocks ?? {},
    products: (config.products ?? []).map((product) => ({
      ...product,
      status: product.status ?? 'live',
      order: product.order ?? 999,
    })),
  };
}

/**
 * Validate, and refuse to continue if the config is wrong.
 *
 * A tenant config is the one input that decides whether a client's studio
 * works at all, and it is edited by hand. Failing loudly here, with every
 * problem named and located, is the difference between a five-minute fix and
 * someone staring at a black screen wondering which of forty numbers is wrong.
 *
 * @param {TenantConfig} config
 * @param {{ label?: string }} [options] What to call this config in the error.
 * @returns {TenantConfig} the normalised config
 */
export function assertValidTenantConfig(config, { label } = {}) {
  const { valid, errors, warnings } = validateTenantConfig(config);

  const name = label ?? config?.tenant ?? 'tenant config';

  if (warnings.length && typeof console !== 'undefined') {
    for (const warning of warnings) {
      console.warn(`[${name}] ${warning.path || '(root)'}: ${warning.message}`);
    }
  }

  if (!valid) {
    const detail = errors
      .map((e) => `  • ${e.path || '(root)'}: ${e.message}`)
      .join('\n');
    throw new Error(
      `${name} is not a valid tenant config — ${errors.length} problem${
        errors.length === 1 ? '' : 's'
      }:\n${detail}`
    );
  }

  return normaliseTenantConfig(config);
}

/** Format a result for a terminal. Used by the onboarding tooling. */
export function formatValidationResult(result, label = 'config') {
  const lines = [];
  for (const w of result.warnings) lines.push(`warn  ${w.path || '(root)'}: ${w.message}`);
  for (const e of result.errors) lines.push(`error ${e.path || '(root)'}: ${e.message}`);
  lines.push(
    result.valid
      ? `${label}: valid${result.warnings.length ? ` (${result.warnings.length} warning(s))` : ''}`
      : `${label}: ${result.errors.length} error(s)`
  );
  return lines.join('\n');
}

export default validateTenantConfig;
