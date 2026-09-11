import { beforeEach, describe, expect, it } from 'vitest';
import studioReducer, {
  createInitialState,
  createTransform,
  transformLimitsFor,
} from './studioReducer';

/**
 * The studio's state machine.
 *
 * The fixtures here are deliberately literal rather than imported from the
 * product registry: the reducer's contract is with the *shape* of a product,
 * not with any particular catalogue, and these tests should keep passing when
 * the catalogue stops being a module.
 *
 * Their dimensions are chosen to be easy to check by eye. The cup is 200 × 100
 * mm, so a default width of 0.5 is 100 mm and the offset limits are ±100 and
 * ±50. The box is square and smaller, so switching between them exercises the
 * fact that a millimetre bound means nothing without a print area behind it.
 */

const CUP = {
  id: 'cup',
  print: {
    stockColor: '#f7f5f1',
    physical: { widthMm: 200, heightMm: 100, bleedMm: 3, safeMm: 5 },
    defaultTransform: { width: 0.5, x: 0, y: 0, rotation: 0, repeat: 1 },
  },
};

const BOX = {
  id: 'box',
  print: {
    stockColor: '#5c6068',
    physical: { widthMm: 100, heightMm: 100, bleedMm: 3, safeMm: 5 },
    defaultTransform: { width: 0.4, x: 0, y: -0.5, rotation: 0, repeat: 1 },
  },
};

const ARTWORK = { name: 'logo.svg', aspect: 1, width: 512, height: 512 };

let initial;
beforeEach(() => {
  initial = createInitialState(CUP);
});

describe('transformLimitsFor', () => {
  it('scales the limits to the product, because millimetres are not ratios', () => {
    const cup = transformLimitsFor(CUP.print);
    const box = transformLimitsFor(BOX.print);

    expect(cup.widthMm.max).toBeCloseTo(200 * 2.5, 6);
    expect(box.widthMm.max).toBeCloseTo(100 * 2.5, 6);
  });

  it('lets the artwork centre reach either edge, and no further', () => {
    const { xMm, yMm } = transformLimitsFor(CUP.print);
    expect(xMm.min).toBeCloseTo(-100, 6);
    expect(xMm.max).toBeCloseTo(100, 6);
    expect(yMm.min).toBeCloseTo(-50, 6);
    expect(yMm.max).toBeCloseTo(50, 6);
  });

  it('keeps rotation and repeat as fixed ranges — they are not lengths', () => {
    expect(transformLimitsFor(CUP.print).rotation).toEqual(
      transformLimitsFor(BOX.print).rotation
    );
    expect(transformLimitsFor(CUP.print).repeat).toEqual(transformLimitsFor(BOX.print).repeat);
  });
});

describe('createTransform', () => {
  it('resolves the declared fractions into millimetres', () => {
    expect(createTransform(CUP)).toMatchObject({
      widthMm: 100,
      xMm: 0,
      yMm: 0,
      rotation: 0,
      repeat: 1,
    });
  });

  it('reads offset fractions as halves of the print area', () => {
    // -0.5 of a 100 mm height is a quarter of the way up from centre.
    expect(createTransform(BOX).yMm).toBeCloseTo(-25, 6);
  });

  it('gives the same fraction different millimetres on different products', () => {
    expect(createTransform(CUP).widthMm).toBe(100);
    expect(createTransform(BOX).widthMm).toBe(40);
  });
});

describe('createInitialState', () => {
  it('opens on the product, with its default placement and stock', () => {
    expect(initial.productId).toBe('cup');
    expect(initial.baseColor).toBe('#f7f5f1');
    expect(initial.transform.widthMm).toBe(100);
    expect(initial.artwork).toBeNull();
    expect(initial.status).toBe('idle');
  });

  it('starts with an empty history', () => {
    expect(initial.history).toEqual([]);
    expect(initial.future).toEqual([]);
  });
});

describe('transform', () => {
  const move = (state, patch, commit) =>
    studioReducer(state, { type: 'transform', patch, commit, product: CUP });

  it('records history when the change is committed', () => {
    const next = move(initial, { widthMm: 120 });
    expect(next.transform.widthMm).toBe(120);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].transform.widthMm).toBe(100);
  });

  it('does not record history while a drag is still in flight', () => {
    const next = move(initial, { widthMm: 120 }, false);
    expect(next.transform.widthMm).toBe(120);
    expect(next.history).toHaveLength(0);
  });

  it('clamps every axis to the product it is on', () => {
    const next = move(initial, {
      widthMm: 9999,
      xMm: 400,
      yMm: -400,
      rotation: 900,
      repeat: 50,
    });

    const limits = transformLimitsFor(CUP.print);
    expect(next.transform.widthMm).toBeCloseTo(limits.widthMm.max, 6);
    expect(next.transform.xMm).toBeCloseTo(100, 6);
    expect(next.transform.yMm).toBeCloseTo(-50, 6);
    expect(next.transform.rotation).toBe(180);
    expect(next.transform.repeat).toBe(6);
  });

  it('clamps against the product in hand, not a fixed range', () => {
    const onBox = studioReducer(createInitialState(BOX), {
      type: 'transform',
      patch: { xMm: 400 },
      product: BOX,
    });
    // The box is half as wide, so its edge is half as far away.
    expect(onBox.transform.xMm).toBeCloseTo(50, 6);
  });

  it('rounds repeat to a whole number of copies', () => {
    expect(move(initial, { repeat: 2.6 }).transform.repeat).toBe(3);
  });
});

describe('undo and redo', () => {
  const move = (state, patch) =>
    studioReducer(state, { type: 'transform', patch, product: CUP });

  it('round-trips a committed change', () => {
    const moved = move(initial, { widthMm: 120 });
    const undone = studioReducer(moved, { type: 'undo' });
    expect(undone.transform.widthMm).toBe(100);
    expect(undone.future).toHaveLength(1);

    const redone = studioReducer(undone, { type: 'redo' });
    expect(redone.transform.widthMm).toBe(120);
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
    const moved = move(initial, { widthMm: 120 });
    const undone = studioReducer(moved, { type: 'undo' });
    expect(move(undone, { widthMm: 140 }).future).toHaveLength(0);
  });

  it('caps the history at 40 entries', () => {
    let state = initial;
    for (let i = 0; i < 60; i += 1) state = move(state, { widthMm: 20 + i });
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
      product: CUP,
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
    const transform = { ...createTransform(BOX), widthMm: 31 };
    const switched = studioReducer(initial, { type: 'select-product', product: BOX, transform });
    expect(switched.transform.widthMm).toBe(31);
  });

  it('lands on the new product default when no placement is given', () => {
    const switched = studioReducer(initial, { type: 'select-product', product: BOX });
    expect(switched.transform.widthMm).toBe(40);
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

  it('clamps a placement that arrives with the artwork', () => {
    const loaded = studioReducer(initial, {
      type: 'artwork-loaded',
      artwork: ARTWORK,
      transform: { ...createTransform(CUP), xMm: 9999 },
      product: CUP,
    });
    expect(loaded.transform.xMm).toBeCloseTo(100, 6);
  });

  it('resets placement and history when the artwork is removed', () => {
    const loaded = studioReducer(initial, {
      type: 'artwork-loaded',
      artwork: ARTWORK,
      transform: createTransform(CUP),
      product: CUP,
    });
    const moved = studioReducer(loaded, {
      type: 'transform',
      patch: { widthMm: 180 },
      product: CUP,
    });
    const cleared = studioReducer(moved, { type: 'artwork-cleared', product: CUP });

    expect(cleared.artwork).toBeNull();
    expect(cleared.status).toBe('idle');
    expect(cleared.transform.widthMm).toBe(100);
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
