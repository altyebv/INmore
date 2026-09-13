// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import exportProof from './exportProof';

/**
 * `exportProof` used to bake INMORE into two places: the download's filename
 * and the guide colours drawn over it. Both are now the caller's to supply —
 * these tests are about the wiring staying honest rather than quietly falling
 * back to the old literals.
 */

const PRODUCT = {
  slug: 'cup',
  print: {
    mode: 'texture',
    uv: { x: 0, y: 0, width: 1, height: 1 },
    physical: { widthMm: 100, heightMm: 100, bleedMm: 3, safeMm: 5 },
    wrap: false,
    stockColor: '#ffffff',
  },
};

const TRANSFORM = {
  widthMm: 50,
  xMm: 0,
  yMm: 0,
  rotation: 0,
  repeat: 1,
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

/** A 2D context that records nothing but what these tests care about. */
function stubCanvas() {
  const strokeStyles = [];
  const ctx = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return () => {};
      },
      set(target, prop, value) {
        target[prop] = value;
        if (prop === 'strokeStyle') strokeStyles.push(value);
        return true;
      },
    }
  );

  HTMLCanvasElement.prototype.getContext = () => ctx;
  HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
    callback(new Blob(['x'], { type: 'image/png' }));
  };

  return strokeStyles;
}

let downloads;

beforeEach(() => {
  downloads = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    downloads.push(this.download);
  });
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('exportProof', () => {
  it('names the file after the tenant, not a hardcoded brand', async () => {
    stubCanvas();
    await exportProof(PRODUCT, null, TRANSFORM, { tenant: 'acme' });
    expect(downloads[0]).toBe('acme-cup-proof-300dpi.png');
  });

  it('falls back to a neutral name when no tenant is given', async () => {
    stubCanvas();
    await exportProof(PRODUCT, null, TRANSFORM, {});
    expect(downloads[0]).toBe('studio-cup-proof-300dpi.png');
  });

  it('draws the safe guide in the colour it is given, not INMORE’s accent', async () => {
    const strokeStyles = stubCanvas();
    await exportProof(PRODUCT, null, TRANSFORM, {
      tenant: 'acme',
      guideColors: { safe: 'rgba(1, 2, 3, 0.85)' },
    });
    expect(strokeStyles).toContain('rgba(1, 2, 3, 0.85)');
    expect(strokeStyles).not.toContain('rgba(226, 72, 31, 0.85)');
  });

  it('reads the press resolution the caller passes rather than always using 300', async () => {
    stubCanvas();
    await exportProof(PRODUCT, null, TRANSFORM, { tenant: 'acme', dpi: 150 });
    expect(downloads[0]).toBe('acme-cup-proof-150dpi.png');
  });
});
