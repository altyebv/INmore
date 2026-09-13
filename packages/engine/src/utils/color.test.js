import { describe, expect, it } from 'vitest';
import { hexToRgba } from './color';

describe('hexToRgba', () => {
  it('converts a six-digit hex to rgba at the given alpha', () => {
    expect(hexToRgba('#e2481f', 0.85)).toBe('rgba(226, 72, 31, 0.85)');
  });

  it('expands a three-digit hex', () => {
    expect(hexToRgba('#0b0', 0.5)).toBe('rgba(0, 187, 0, 0.5)');
  });

  it('works without the leading #', () => {
    expect(hexToRgba('e2481f', 0.85)).toBe('rgba(226, 72, 31, 0.85)');
  });

  it('returns undefined for anything that is not a hex colour', () => {
    expect(hexToRgba('rebeccapurple', 0.5)).toBeUndefined();
    expect(hexToRgba(undefined, 0.5)).toBeUndefined();
    expect(hexToRgba(null, 0.5)).toBeUndefined();
  });
});
