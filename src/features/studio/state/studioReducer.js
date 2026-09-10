import { clamp } from '@/lib/utils/math';
import { IDENTITY_CROP } from '@/lib/artwork/constants';

/**
 * Studio state machine.
 *
 * Deliberately a plain reducer with no React imports so it can be unit tested
 * and, later, reused by a saved-configuration or quote flow without change.
 */

export const STUDIO_STEPS = ['product', 'artwork', 'arrange'];

export const TRANSFORM_LIMITS = {
  scale: { min: 0.05, max: 2.5, step: 0.01 },
  offset: { min: -1, max: 1, step: 0.005 },
  rotation: { min: -180, max: 180, step: 1 },
  repeat: { min: 1, max: 6, step: 1 },
};

export function createTransform(product) {
  return { ...product.print.defaultTransform, crop: IDENTITY_CROP };
}

export function createInitialState(product) {
  return {
    productId: product.id,
    artwork: null,
    transform: createTransform(product),
    /** Chosen stock. Not part of the transform — it survives an artwork reset. */
    baseColor: product.print.stockColor,
    status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
    error: null,
    view: 'product', // 'product' | 'flat'
    autoRotate: true,
    history: [],
    future: [],
  };
}

const TRACKED_KEYS = ['transform', 'baseColor'];

function snapshot(state) {
  return TRACKED_KEYS.reduce((acc, key) => ({ ...acc, [key]: state[key] }), {});
}

function withHistory(state, next) {
  return {
    ...next,
    history: [...state.history, snapshot(state)].slice(-40),
    future: [],
  };
}

function clampTransform(t) {
  return {
    ...t,
    scale: clamp(t.scale, TRANSFORM_LIMITS.scale.min, TRANSFORM_LIMITS.scale.max),
    x: clamp(t.x, TRANSFORM_LIMITS.offset.min, TRANSFORM_LIMITS.offset.max),
    y: clamp(t.y, TRANSFORM_LIMITS.offset.min, TRANSFORM_LIMITS.offset.max),
    rotation: clamp(t.rotation, TRANSFORM_LIMITS.rotation.min, TRANSFORM_LIMITS.rotation.max),
    repeat: clamp(Math.round(t.repeat), TRANSFORM_LIMITS.repeat.min, TRANSFORM_LIMITS.repeat.max),
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
        transform: clampTransform({ ...action.transform }),
        history: [],
        future: [],
      };

    case 'artwork-error':
      return { ...state, status: 'error', error: action.error };

    case 'artwork-cleared':
      return {
        ...state,
        artwork: null,
        status: 'idle',
        error: null,
        transform: createTransform(action.product),
        history: [],
        future: [],
      };

    case 'base-color': {
      if (action.color === state.baseColor) return state;
      return withHistory(state, { ...state, baseColor: action.color });
    }

    case 'transform': {
      const next = clampTransform({ ...state.transform, ...action.patch });
      const base = { ...state, transform: next };
      return action.commit === false ? base : withHistory(state, base);
    }

    case 'reset-transform':
      return withHistory(state, { ...state, transform: createTransform(action.product) });

    case 'undo': {
      if (!state.history.length) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        ...previous,
        history: state.history.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, 40),
      };
    }

    case 'redo': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        ...state,
        ...next,
        history: [...state.history, snapshot(state)].slice(-40),
        future: rest,
      };
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
