import { clamp } from '../utils/math';
import { IDENTITY_CROP } from '../artwork/constants';

/**
 * Studio state machine.
 *
 * Deliberately a plain reducer with no React imports so it can be unit tested
 * and, later, reused by a saved-configuration or quote flow without change.
 */

export const STUDIO_STEPS = ['product', 'artwork', 'arrange'];

/**
 * How far a placement may go, in millimetres.
 *
 * These have to be derived per product rather than declared once: a 250 mm cup
 * wrap and a 220 mm box lid do not share a sensible range, and "2.5" means
 * nothing without saying 2.5 of what. The *proportions* are fixed — artwork may
 * be a twentieth of the print area or two and a half times it, and its centre
 * may travel to either edge — and the millimetres follow from the product.
 */
export const TRANSFORM_BOUNDS = {
  /** Artwork width, as a multiple of the print area's width. */
  width: { min: 0.05, max: 2.5 },
  rotation: { min: -180, max: 180, step: 1 },
  repeat: { min: 1, max: 6, step: 1 },
};

/** @param {import('../catalogue/schema').ProductPrintConfig} print */
export function transformLimitsFor(print) {
  const { widthMm, heightMm } = print.physical;
  const { width, rotation, repeat } = TRANSFORM_BOUNDS;

  return {
    widthMm: {
      min: widthMm * width.min,
      max: widthMm * width.max,
      step: widthMm / 400,
    },
    // The centre may reach either edge of the print area, no further.
    xMm: { min: -widthMm / 2, max: widthMm / 2, step: widthMm / 400 },
    yMm: { min: -heightMm / 2, max: heightMm / 2, step: heightMm / 400 },
    rotation,
    repeat,
  };
}

/**
 * A product's default placement.
 *
 * `defaultTransform` declares the artwork's width as a fraction of the print
 * area — the one proportion that is genuinely a product's own opinion, and
 * that stays meaningful whatever the product's real size. It is resolved to
 * millimetres here, once, so nothing downstream has to hold two units at the
 * same time.
 */
export function createTransform(product) {
  const { physical, defaultTransform: d } = product.print;

  return {
    widthMm: (d.width ?? 0.5) * physical.widthMm,
    xMm: (d.x ?? 0) * (physical.widthMm / 2),
    yMm: (d.y ?? 0) * (physical.heightMm / 2),
    rotation: d.rotation ?? 0,
    repeat: d.repeat ?? 1,
    crop: IDENTITY_CROP,
  };
}

export function createInitialState(product) {
  return {
    productId: product.id,
    artwork: null,
    transform: createTransform(product),
    /** Chosen stock. Not part of the transform — it survives an artwork reset. */
    baseColor: product.print.stockColor,
    /**
     * Text layers, bottom first. Each is `{ id, content, fontId, color, align,
     * aspect, transform }` — plain data, with the placement in the same
     * millimetres as an image's. The words are state; the measured artwork
     * built from them is derived (see the provider).
     */
    texts: [],
    /** What the placement controls act on: `'artwork'`, a text id, or null. */
    selectedId: null,
    /**
     * The state a drag started from. A drag changes state on every frame
     * without recording history; when it is committed, this is what undo goes
     * back to — not the place the pointer finished.
     */
    pending: null,
    status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
    error: null,
    view: 'product', // 'product' | 'flat'
    autoRotate: true,
    history: [],
    future: [],
  };
}

const TRACKED_KEYS = ['transform', 'baseColor', 'texts'];

function snapshot(state) {
  return TRACKED_KEYS.reduce((acc, key) => ({ ...acc, [key]: state[key] }), {});
}

/**
 * Record a change. If a drag or an edit has been running, undo returns to
 * where it started; otherwise to the state just before this change.
 */
function withHistory(state, next) {
  return {
    ...next,
    pending: null,
    history: [...state.history, state.pending ?? snapshot(state)].slice(-40),
    future: [],
  };
}

/** A change in flight: applied now, recorded when it is committed. */
function inFlight(state, next) {
  return { ...next, pending: state.pending ?? snapshot(state) };
}

/** Keep `selectedId` pointing at something that exists. */
function withValidSelection(state) {
  const valid = (id) =>
    (id === 'artwork' && state.artwork) || state.texts.some((layer) => layer.id === id);
  if (valid(state.selectedId)) return state;
  const fallback = state.texts.length
    ? state.texts[state.texts.length - 1].id
    : state.artwork
      ? 'artwork'
      : null;
  return { ...state, selectedId: fallback };
}

/** Clamp a text layer's placement to what its print area can hold. */
function clampText(layer, print) {
  return { ...layer, transform: clampTransform(layer.transform, print) };
}

/**
 * Hold a placement inside what the product can actually print.
 *
 * Takes the print config because the limits are millimetres now, and a
 * millimetre bound only means something against a particular print area.
 */
function clampTransform(t, print) {
  const limits = transformLimitsFor(print);
  return {
    ...t,
    widthMm: clamp(t.widthMm, limits.widthMm.min, limits.widthMm.max),
    xMm: clamp(t.xMm, limits.xMm.min, limits.xMm.max),
    yMm: clamp(t.yMm, limits.yMm.min, limits.yMm.max),
    rotation: clamp(t.rotation, limits.rotation.min, limits.rotation.max),
    repeat: clamp(Math.round(t.repeat), limits.repeat.min, limits.repeat.max),
  };
}

export function studioReducer(state, action) {
  switch (action.type) {
    case 'select-product': {
      if (action.product.id === state.productId) return state;
      const base = createInitialState(action.product);
      return {
        ...base,
        // Artwork survives a product change — the visitor's logo is theirs, the
        // product is just the surface it lands on. The stock does not: board
        // and cup stock are different materials with different ranges.
        artwork: state.artwork,
        // Text is the visitor's too. It arrives already re-fitted to the new
        // print area (the provider knows both products; the reducer only the new).
        texts: (action.texts ?? state.texts).map((layer) => clampText(layer, action.product.print)),
        selectedId: state.selectedId,
        status: state.artwork ? 'ready' : 'idle',
        // A placement computed for the new product's print area, so the logo
        // arrives correctly sized rather than reset to an arbitrary default.
        transform: action.transform ?? base.transform,
      };
    }

    case 'artwork-loading':
      return { ...state, status: 'loading', error: null };

    case 'artwork-loaded':
      return {
        ...state,
        artwork: action.artwork,
        status: 'ready',
        error: null,
        transform: clampTransform({ ...action.transform }, action.product.print),
        selectedId: 'artwork',
        pending: null,
        history: [],
        future: [],
      };

    case 'artwork-error':
      return { ...state, status: 'error', error: action.error };

    case 'artwork-cleared':
      return withValidSelection({
        ...state,
        artwork: null,
        status: 'idle',
        error: null,
        transform: createTransform(action.product),
        pending: null,
        history: [],
        future: [],
      });

    case 'base-color': {
      if (action.color === state.baseColor) return state;
      return withHistory(state, { ...state, baseColor: action.color });
    }

    case 'transform': {
      const next = clampTransform({ ...state.transform, ...action.patch }, action.product.print);
      const base = { ...state, transform: next };
      if (action.commit === false) return inFlight(state, base);
      // Nothing changed and nothing was in flight: a click, not an edit.
      if (!state.pending && !Object.keys(action.patch ?? {}).length) return state;
      return withHistory(state, base);
    }

    case 'reset-transform':
      return withHistory(state, { ...state, transform: createTransform(action.product) });

    case 'select-layer': {
      if (action.id === state.selectedId) return state;
      return withValidSelection({ ...state, selectedId: action.id });
    }

    case 'text-add':
      return withHistory(state, {
        ...state,
        texts: [...state.texts, clampText(action.layer, action.product.print)],
        selectedId: action.layer.id,
      });

    case 'text-update': {
      const texts = state.texts.map((layer) => {
        if (layer.id !== action.id) return layer;
        return clampText(
          {
            ...layer,
            ...action.patch,
            transform: { ...layer.transform, ...action.transform },
          },
          action.product.print
        );
      });
      const base = { ...state, texts };
      if (action.commit === false) return inFlight(state, base);
      // A commit with nothing behind it — focus leaving a field nobody typed in.
      if (!state.pending && !Object.keys(action.patch ?? {}).length) return state;
      return withHistory(state, base);
    }

    case 'text-transform': {
      const texts = state.texts.map((layer) =>
        layer.id === action.id
          ? clampText({ ...layer, transform: { ...layer.transform, ...action.patch } }, action.product.print)
          : layer
      );
      const base = { ...state, texts };
      if (action.commit === false) return inFlight(state, base);
      if (!state.pending && !Object.keys(action.patch ?? {}).length) return state;
      return withHistory(state, base);
    }

    /*
     * A font finished loading and the text is wider or narrower than it was
     * measured to be. Not the visitor's edit, so it is not history: the
     * letters keep their size and the box follows.
     */
    case 'text-remeasure':
      return {
        ...state,
        texts: state.texts.map((layer) =>
          layer.id === action.id
            ? clampText(
                {
                  ...layer,
                  aspect: action.aspect,
                  transform: { ...layer.transform, widthMm: action.widthMm },
                },
                action.product.print
              )
            : layer
        ),
      };

    case 'text-remove':
      return withValidSelection(
        withHistory(state, {
          ...state,
          texts: state.texts.filter((layer) => layer.id !== action.id),
        })
      );

    case 'undo': {
      if (!state.history.length) return state;
      const previous = state.history[state.history.length - 1];
      return withValidSelection({
        ...state,
        ...previous,
        pending: null,
        history: state.history.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, 40),
      });
    }

    case 'redo': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return withValidSelection({
        ...state,
        ...next,
        pending: null,
        history: [...state.history, snapshot(state)].slice(-40),
        future: rest,
      });
    }

    case 'set-view':
      return { ...state, view: action.view };

    case 'toggle-auto-rotate':
      return { ...state, autoRotate: action.value ?? !state.autoRotate };

    default:
      return state;
  }
}

export default studioReducer;
