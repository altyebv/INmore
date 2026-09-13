// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createCatalogue } from './catalogue';
import Studio from './Studio';

/**
 * `ui.picker` hides the product switcher a tenant does not want visitors
 * changing products from. It has to disappear from both layouts — the
 * desktop stage header and the touch stage header — without taking anything
 * else with it, which is why the touch assertions also check the drawer's
 * rail: it lists four sections regardless of the picker, and must go on
 * doing so once the header above it is gone.
 *
 * The heavy parts of a studio — the 3D stage, artwork compositing — are
 * stubbed out here. They need a real canvas and WebGL, which is what
 * `composeArtwork.test.js` and a browser are for; this file is only about
 * what the two layouts choose to render.
 */

vi.mock('./components/StudioStage', () => ({
  default: ({ header, actions, footer }) => (
    <div data-testid="stage">
      <div data-testid="stage-header">{header}</div>
      <div data-testid="stage-actions">{actions}</div>
      <div data-testid="stage-footer">{footer}</div>
    </div>
  ),
}));
vi.mock('./components/ArtworkControls', () => ({ default: () => null }));
vi.mock('./components/ArtworkDropzone', () => ({ default: () => null }));
vi.mock('./components/FlatPreview', () => ({ default: () => null }));
vi.mock('./components/ProductDetails', () => ({ default: () => null }));
vi.mock('./components/StockPicker', () => ({
  default: () => null,
  useStockName: () => 'Stock',
}));
vi.mock('./three/useArtworkTexture', () => ({ default: () => ({ texture: null }) }));

const STOCKS = { white: { id: 'white', color: '#ffffff', label: 'White' } };

const catalogue = createCatalogue({
  products: [
    {
      id: 'cup',
      slug: 'cup',
      name: 'Cup',
      status: 'live',
      model: { url: 'models/cup.glb', heightM: 0.1, printMeshName: 'Body' },
      print: {
        mode: 'texture',
        physical: { widthMm: 100, heightMm: 100, bleedMm: 0, safeMm: 0 },
        stock: 'white',
        defaultTransform: { width: 0.5, x: 0, y: 0, rotation: 0, repeat: 1 },
      },
      material: {},
    },
  ],
  stocks: STOCKS,
});

/** `useElementShape` measures the root; jsdom answers every rect the same. */
function stubShape(width, height = 800) {
  Element.prototype.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON() {},
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the desktop layout', () => {
  it('shows the product picker by default', () => {
    stubShape(1400);
    render(<Studio catalogue={catalogue} tenant="acme" />);
    expect(screen.getByRole('group', { name: 'Choose a product' })).toBeTruthy();
  });

  it('hides it when the tenant turns the picker off', () => {
    stubShape(1400);
    render(<Studio catalogue={catalogue} tenant="acme" ui={{ picker: false }} />);
    expect(screen.queryByRole('group', { name: 'Choose a product' })).toBeNull();
  });
});

describe('the touch layout', () => {
  it('shows the product picker by default', () => {
    stubShape(600);
    render(<Studio catalogue={catalogue} tenant="acme" />);
    expect(screen.getByRole('group', { name: 'Choose a product' })).toBeTruthy();
  });

  it('hides the picker without breaking the rail below it', () => {
    stubShape(600);
    render(<Studio catalogue={catalogue} tenant="acme" ui={{ picker: false }} />);

    expect(screen.queryByRole('group', { name: 'Choose a product' })).toBeNull();

    // The drawer's own four sections are unrelated to the picker and must
    // still all be there: colour, logo, placement and info.
    expect(screen.getByRole('button', { name: 'Colour' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Logo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Place' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Info' })).toBeTruthy();
  });
});
