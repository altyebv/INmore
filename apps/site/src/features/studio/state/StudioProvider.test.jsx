// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { createCatalogue } from '@/products';
import { LocaleProvider } from '@/i18n';
import ProductPicker from '../components/ProductPicker';
import StudioProvider, { useStudio } from './StudioProvider';

/**
 * Two studios, one page.
 *
 * This is the property the extraction rests on, and the one the old
 * module-level catalogue made impossible: a component that imports its
 * products cannot show two different sets of them. Everything else in the
 * refactor is in service of this test passing.
 */

const STOCKS = {
  white: { id: 'white', color: '#ffffff', label: 'White' },
  kraft: { id: 'kraft', color: '#c8ab84', label: 'Kraft' },
};

const product = (id, name, order) => ({
  id,
  slug: id,
  name,
  category: 'Test',
  status: 'live',
  order,
  print: {
    stock: 'white',
    stockPalette: ['white', 'kraft'],
    texture: { width: 100, height: 100 },
    uv: { x: 0, y: 0, width: 1, height: 1 },
    physical: { widthMm: 100, heightMm: 100, bleedMm: 0, safeMm: 0 },
    wrap: false,
    defaultTransform: { scale: 0.5, x: 0, y: 0, rotation: 0, repeat: 1 },
  },
});

const cups = createCatalogue({
  products: [product('cup-a', 'Paper cup', 10), product('cup-b', 'Cold cup', 20)],
  stocks: STOCKS,
});

const boxes = createCatalogue({
  products: [product('box-a', 'Gift box', 10), product('box-b', 'Mailer box', 20)],
  stocks: STOCKS,
});

/** Reports what its own provider thinks is selected. */
function Selected({ label }) {
  const { product: selected, catalogue } = useStudio();
  return (
    <p>
      {label}: {selected.id} of {catalogue.live.length}
    </p>
  );
}

function Studio({ catalogue, label, initialProductId }) {
  return (
    <StudioProvider catalogue={catalogue} initialProductId={initialProductId}>
      <section aria-label={label}>
        <Selected label={label} />
        <ProductPicker selectedId={undefined} onSelect={() => {}} />
      </section>
    </StudioProvider>
  );
}

const mount = (ui) => render(<LocaleProvider initialLocale="en">{ui}</LocaleProvider>);

afterEach(cleanup);

describe('a single studio', () => {
  it('opens on the catalogue default', () => {
    mount(<Studio catalogue={cups} label="one" />);
    expect(screen.getByText('one: cup-a of 2')).toBeTruthy();
  });

  it('honours an explicit starting product', () => {
    mount(<Studio catalogue={cups} label="one" initialProductId="cup-b" />);
    expect(screen.getByText('one: cup-b of 2')).toBeTruthy();
  });

  it('falls back to the first live product when the id is unknown', () => {
    mount(<Studio catalogue={cups} label="one" initialProductId="nonsense" />);
    expect(screen.getByText('one: cup-a of 2')).toBeTruthy();
  });

  it('refuses a catalogue it cannot open anything from', () => {
    const empty = createCatalogue({ products: [], stocks: STOCKS });

    // React logs every render error to the console before rethrowing it. The
    // throw is what this test is asserting, so the log is noise that would
    // bury a real failure.
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => mount(<Studio catalogue={empty} label="one" />)).toThrow(
        /no live products/
      );
    } finally {
      quiet.mockRestore();
    }
  });
});

describe('two studios on one page', () => {
  it('each opens on its own catalogue', () => {
    mount(
      <>
        <Studio catalogue={cups} label="left" />
        <Studio catalogue={boxes} label="right" />
      </>
    );

    expect(screen.getByText('left: cup-a of 2')).toBeTruthy();
    expect(screen.getByText('right: box-a of 2')).toBeTruthy();
  });

  it('each picker lists only its own products', () => {
    mount(
      <>
        <Studio catalogue={cups} label="left" />
        <Studio catalogue={boxes} label="right" />
      </>
    );

    const left = within(screen.getByLabelText('left'));
    const right = within(screen.getByLabelText('right'));

    expect(left.getByText('Paper cup')).toBeTruthy();
    expect(left.queryByText('Gift box')).toBeNull();

    expect(right.getByText('Gift box')).toBeTruthy();
    expect(right.queryByText('Paper cup')).toBeNull();
  });

  it('holds independent selections', () => {
    mount(
      <>
        <Studio catalogue={cups} label="left" initialProductId="cup-b" />
        <Studio catalogue={cups} label="right" initialProductId="cup-a" />
      </>
    );

    // Same catalogue, different state: the provider owns the selection, the
    // catalogue only says what may be selected.
    expect(screen.getByText('left: cup-b of 2')).toBeTruthy();
    expect(screen.getByText('right: cup-a of 2')).toBeTruthy();
  });
});
