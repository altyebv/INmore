import { beforeEach, describe, expect, it } from 'vitest';
import studioReducer, {
  TRANSFORM_LIMITS,
  createInitialState,
  createTransform,
} from './studioReducer';

/**
 * The studio's state machine.
 *
 * The fixtures here are deliberately literal rather than imported from the
 * product registry: the reducer's contract is with the *shape* of a product,
 * not with any particular catalogue, and these tests should keep passing when
 * the catalogue stops being a module.
 */

const CUP = {
  id: 'cup',
  print: {
    stockColor: '#f7f5f1',
    defaultTransform: { scale: 0.42, x: 0, y: 0, rotation: 0, repeat: 1 },
  },
};

const BOX = {
  id: 'box',
  print: {
    stockColor: '#5c6068',
    defaultTransform: { scale: 0.5, x: 0, y: 0, rotation: 0, repeat: 1 },
  },
};

const ARTWORK = { name: 'logo.svg', aspect: 1, width: 512, height: 512 };

let initial;
beforeEach(() => {
  initial = createInitialState(CUP);
});

describe('createInitialState', () => {
  it('opens on the product, with its default placement and stock', () => {
    expect(initial.productId).toBe('cup');
    expect(initial.baseColor).toBe('#f7f5f1');
    expect(initial.transform).toMatchObject(CUP.print.defaultTransform);
    expect(initial.artwork).toBeNull();
    expect(initial.status).toBe('idle');
  });

  it('starts with an empty history', () => {
    expect(initial.history).toEqual([]);
    expect(initial.future).toEqual([]);
  });
});

describe('transform', () => {
  it('records history when the change is committed', () => {
    const next = studioReducer(initial, { type: 'transform', patch: { scale: 0.6 } });
    expect(next.transform.scale).toBe(0.6);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].transform.scale).toBe(0.42);
  });

  it('does not record history while a drag is still in flight', () => {
    const next = studioReducer(initial, {
      type: 'transform',
      patch: { scale: 0.6 },
      commit: false,
    });
    expect(next.transform.scale).toBe(0.6);
    expect(next.history).toHaveLength(0);
  });

  it('clamps every axis to its limit', () => {
    const next = studioReducer(initial, {
      type: 'transform',
      patch: { scale: 99, x: 4, y: -4, rotation: 900, repeat: 50 },
    });
    expect(next.transform.scale).toBe(TRANSFORM_LIMITS.scale.max);
    expect(next.transform.x).toBe(TRANSFORM_LIMITS.offset.max);
    expect(next.transform.y).toBe(TRANSFORM_LIMITS.offset.min);
    expect(next.transform.rotation).toBe(TRANSFORM_LIMITS.rotation.max);
    expect(next.transform.repeat).toBe(TRANSFORM_LIMITS.repeat.max);
  });

  it('rounds repeat to a whole number of copies', () => {
    const next = studioReducer(initial, { type: 'transform', patch: { repeat: 2.6 } });
    expect(next.transform.repeat).toBe(3);
  });
});

describe('undo and redo', () => {
  it('round-trips a committed change', () => {
    const moved = studioReducer(initial, { type: 'transform', patch: { scale: 0.6 } });
    const undone = studioReducer(moved, { type: 'undo' });
    expect(undone.transform.scale).toBe(0.42);
    expect(undone.future).toHaveLength(1);

    const redone = studioReducer(undone, { type: 'redo' });
    expect(redone.transform.scale).toBe(0.6);
    expect(redone.future).toHaveLength(0);
  });

  it('tracks stock alongside placement', () => {
    const tinted = studioReducer(initial, { type: 'base-color', color: '#1c1b19' });
    expect(studioReducer(tinted, { type: 'undo' }).baseColor).toBe('#f7f5f1');
  });

  it('is a no-op at either end of the stack', () => {
    expect(studioReducer(initial, { type: 'undo' })).toBe(initial);
    expect(studioReducer(initial, { type: 'redo' })).toBe(initial);
  });

  it('drops the redo stack once a new change is made', () => {
    const moved = studioReducer(initial, { type: 'transform', patch: { scale: 0.6 } });
    const undone = studioReducer(moved, { type: 'undo' });
    const diverged = studioReducer(undone, { type: 'transform', patch: { scale: 0.8 } });
    expect(diverged.future).toHaveLength(0);
  });

  it('caps the history at 40 entries', () => {
    let state = initial;
    for (let i = 0; i < 60; i += 1) {
      state = studioReducer(state, { type: 'transform', patch: { scale: 0.1 + i * 0.01 } });
    }
    expect(state.history).toHaveLength(40);
  });
});

describe('select-product', () => {
  it('is a no-op when the product is already selected', () => {
    expect(studioReducer(initial, { type: 'select-product', product: CUP })).toBe(initial);
  });

  it('carries the uploaded artwork across to the new product', () => {
    const loaded = studioReducer(initial, {
      type: 'artwork-loaded',
      artwork: ARTWORK,
      transform: createTransform(CUP),
    });
    const switched = studioReducer(loaded, { type: 'select-product', product: BOX });
    expect(switched.productId).toBe('box');
    expect(switched.artwork).toBe(ARTWORK);
    expect(switched.status).toBe('ready');
  });

  it('does not carry stock across — the materials are different', () => {
    const tinted = studioReducer(initial, { type: 'base-color', color: '#a8482c' });
    const switched = studioReducer(tinted, { type: 'select-product', product: BOX });
    expect(switched.baseColor).toBe('#5c6068');
  });

  it('takes a placement computed for the new print area when one is given', () => {
    const transform = { ...createTransform(BOX), scale: 0.31 };
    const switched = studioReducer(initial, { type: 'select-product', product: BOX, transform });
    expect(switched.transform.scale).toBe(0.31);
  });
});

describe('artwork lifecycle', () => {
  it('reports a failure by code, not by message', () => {
    const failed = studioReducer(initial, { type: 'artwork-error', error: 'type' });
    expect(failed.status).toBe('error');
    expect(failed.error).toBe('type');
  });

  it('clears the error when a new upload starts', () => {
    const failed = studioReducer(initial, { type: 'artwork-error', error: 'type' });
    const retrying = studioReducer(failed, { type: 'artwork-loading' });
    expect(retrying.status).toBe('loading');
    expect(retrying.error).toBeNull();
  });

  it('resets placement and history when the artwork is removed', () => {
    const loaded = studioReducer(initial, {
      type: 'artwork-loaded',
      artwork: ARTWORK,
      transform: createTransform(CUP),
    });
    const moved = studioReducer(loaded, { type: 'transform', patch: { scale: 1.4 } });
    const cleared = studioReducer(moved, { type: 'artwork-cleared', product: CUP });

    expect(cleared.artwork).toBeNull();
    expect(cleared.status).toBe('idle');
    expect(cleared.transform.scale).toBe(0.42);
    expect(cleared.history).toEqual([]);
  });

  it('keeps the chosen stock when the artwork is removed', () => {
    const tinted = studioReducer(initial, { type: 'base-color', color: '#1c1b19' });
    const cleared = studioReducer(tinted, { type: 'artwork-cleared', product: CUP });
    expect(cleared.baseColor).toBe('#1c1b19');
  });
});

describe('base-color', () => {
  it('is a no-op when the stock is unchanged', () => {
    expect(studioReducer(initial, { type: 'base-color', color: '#f7f5f1' })).toBe(initial);
  });
});
