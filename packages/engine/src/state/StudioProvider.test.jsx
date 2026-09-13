// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createCatalogue } from '../catalogue';
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

/*
 * No provider wrapping. The engine's copy and locale contexts carry working
 * defaults — English, left to right — precisely so a host that has not decided
 * yet still gets a studio rather than a crash. If this needed a provider, the
 * defaults would not be doing their job.
 */
const mount = (ui) => render(ui);

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

/** Selects a product the way a click on the picker does. */
function Pick({ id }) {
  const { selectProduct, catalogue } = useStudio();
  return (
    <button type="button" onClick={() => selectProduct(catalogue.get(id))}>
      pick {id}
    </button>
  );
}

/** A studio whose host controls `sku`, as the embed's frame does. */
function Hosted({ sku }) {
  return (
    <StudioProvider catalogue={cups} sku={sku}>
      <Selected label="shown" />
      <Pick id="cup-a" />
      <Pick id="cup-b" />
    </StudioProvider>
  );
}

/*
 * The embed always passes a sku, because the snippet always names one. These
 * are the regressions from treating it as a lock rather than a request: the
 * visitor's click was undone on the next render — so the picker appeared to
 * change only the stock — and a host's setSku() pinned the studio to its
 * product from then on.
 */
describe('a host that controls the sku', () => {
  it('opens on it', () => {
    mount(<Hosted sku="cup-b" />);
    expect(screen.getByText('shown: cup-b of 2')).toBeTruthy();
  });

  it('lets the visitor choose another product', () => {
    mount(<Hosted sku="cup-a" />);
    fireEvent.click(screen.getByText('pick cup-b'));
    expect(screen.getByText('shown: cup-b of 2')).toBeTruthy();
  });

  it('selects the product the host changes it to', () => {
    const { rerender } = mount(<Hosted sku="cup-a" />);
    rerender(<Hosted sku="cup-b" />);
    expect(screen.getByText('shown: cup-b of 2')).toBeTruthy();
  });

  it('keeps following the host after the visitor has moved', () => {
    const { rerender } = mount(<Hosted sku="cup-a" />);
    rerender(<Hosted sku="cup-b" />);
    fireEvent.click(screen.getByText('pick cup-a'));
    expect(screen.getByText('shown: cup-a of 2')).toBeTruthy();

    // The host catches up with the visitor, then sends them elsewhere.
    rerender(<Hosted sku="cup-a" />);
    rerender(<Hosted sku="cup-b" />);
    expect(screen.getByText('shown: cup-b of 2')).toBeTruthy();
  });

  it('ignores a sku the catalogue does not have', () => {
    const { rerender } = mount(<Hosted sku="cup-a" />);
    rerender(<Hosted sku="nonsense" />);
    expect(screen.getByText('shown: cup-a of 2')).toBeTruthy();
  });
});
