import { describe, expect, it, vi } from 'vitest';
import {
  LINE_HEIGHT,
  REFERENCE_SIZE,
  bestOn,
  createTextArtwork,
  defaultTextTransform,
  fontSizeMm,
  isRtlText,
  measureText,
  refitTransform,
  retuneWidth,
} from './text';
import { composeLayers } from './composeArtwork';
import { resolveTextSettings } from '../catalogue';

/** A measuring context where every character is half the font size wide. */
const measurer = () => ({
  font: '',
  direction: 'ltr',
  measureText: (s) => ({ width: s.length * REFERENCE_SIZE * 0.5 }),
});

const FONT = resolveTextSettings().fonts[0];
const PRINT = {
  physical: { widthMm: 200, heightMm: 100 },
  uv: { x: 0, y: 0, width: 1, height: 1 },
  stockColor: '#ffffff',
};

describe('measureText', () => {
  it('sizes the block from the widest line and the line count', () => {
    const m = measureText('ab\nabcd', FONT, measurer());
    expect(m.blockWidth).toBe(4 * 50);
    expect(m.blockHeight).toBe(2 * LINE_HEIGHT * REFERENCE_SIZE);
    expect(m.aspect).toBeCloseTo(200 / 240);
  });

  it('still gives an aspect where there is no canvas', () => {
    const m = measureText('hello', FONT, null);
    expect(m.aspect).toBeGreaterThan(0);
  });
});

describe('placement', () => {
  it('keeps letter height when the words change', () => {
    const t = { widthMm: 100 };
    // Twice as wide an aspect at the same height means twice the width.
    expect(retuneWidth(t, 4, 8, PRINT)).toBeCloseTo(200);
  });

  it('never opens taller than half the print area', () => {
    const t = defaultTextTransform(PRINT, 1, 0);
    expect(t.widthMm / 1).toBeLessThanOrEqual(50);
  });

  it('staggers later layers', () => {
    expect(defaultTextTransform(PRINT, 4, 1).yMm).not.toBe(defaultTextTransform(PRINT, 4, 0).yMm);
  });

  it('scales a placement to a different print area', () => {
    const to = { physical: { widthMm: 400, heightMm: 100 } };
    const t = refitTransform({ widthMm: 50, xMm: 10, yMm: 5, rotation: 3 }, PRINT, to);
    expect(t).toMatchObject({ widthMm: 100, xMm: 20, yMm: 5, rotation: 3 });
  });

  it('reports font size in millimetres', () => {
    // 120 mm tall block over 2 lines at 1.2 pitch = 50 mm type.
    expect(fontSizeMm({ widthMm: 240 }, 2, 2)).toBeCloseTo(50);
  });
});

describe('colour and script', () => {
  it('picks the readable colour for a stock', () => {
    expect(bestOn('#ffffff', ['#f7f5f1', '#111111'])).toBe('#111111');
    expect(bestOn('#111111', ['#f7f5f1', '#111111'])).toBe('#f7f5f1');
  });

  it('spots right-to-left text', () => {
    expect(isRtlText('مرحبا')).toBe(true);
    expect(isRtlText('hello')).toBe(false);
  });
});

describe('drawing', () => {
  it('sets each line at the size the box implies, aligned as asked', () => {
    const ctx = measurer();
    const art = createTextArtwork({ content: 'ab\ncd', color: '#f00', align: 'left' }, FONT, ctx);
    const calls = [];
    const draw = {
      save: vi.fn(),
      restore: vi.fn(),
      fillText: (...args) => calls.push(args),
    };
    // Box 100 wide: block is 100 wide at reference, so type is 100 px.
    art.draw(draw, 100, 240 * (100 / 100));
    expect(draw.font).toContain('100px');
    expect(draw.fillStyle).toBe('#f00');
    expect(draw.textAlign).toBe('left');
    expect(calls.map((c) => c[1])).toEqual([-50, -50]);
    expect(calls[1][2]).toBeGreaterThan(calls[0][2]);
  });

  it('composes alongside an image without the compositor knowing it is text', () => {
    const drawn = [];
    const ctx = new Proxy(
      {},
      { get: (t, p) => (p in t ? t[p] : () => {}), set: (t, p, v) => ((t[p] = v), true) }
    );
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    const artwork = { aspect: 2, draw: (c, w, h) => drawn.push([w, h]) };
    composeLayers(canvas, PRINT, [{ artwork, transform: { widthMm: 100, xMm: 0, yMm: 0, rotation: 0 } }], {});
    expect(drawn).toHaveLength(1);
    expect(drawn[0][0] / drawn[0][1]).toBeCloseTo(2);
  });
});
