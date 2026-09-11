/**
 * The board INMORE prints on.
 *
 * A print house does not sell "hex #F7F5F1", it sells board. These are named
 * stocks with the colours they actually come out as, so the studio offers a
 * real choice rather than a colour wheel — and a custom value stays available
 * for a client who is matching an existing brand colour.
 *
 * Tenant data, not engine data: a cup printer's stock list is not a gift-box
 * printer's. Products name these by id and the catalogue resolves them, so
 * this table is swappable without touching a single product config.
 *
 * The labels are bilingual here rather than in a translation bundle, because
 * they name this client's materials. The engine has no opinion about what a
 * board is called; it only picks the right language out of what it is handed.
 */

export const STOCKS = {
  white: {
    id: 'white',
    color: '#f7f5f1',
    label: { en: 'White art board', ar: 'كرتون فني أبيض' },
  },
  natural: {
    id: 'natural',
    color: '#c8ab84',
    label: { en: 'Natural kraft', ar: 'كرافت طبيعي' },
  },
  sand: {
    id: 'sand',
    color: '#e0cdb2',
    label: { en: 'Sand board', ar: 'كرتون رملي' },
  },
  slate: {
    id: 'slate',
    color: '#5c6068',
    label: { en: 'Slate board', ar: 'كرتون رمادي' },
  },
  black: {
    id: 'black',
    color: '#1c1b19',
    label: { en: 'Black board', ar: 'كرتون أسود' },
  },
  forest: {
    id: 'forest',
    color: '#2f4a3c',
    label: { en: 'Deep green', ar: 'أخضر داكن' },
  },
  clay: {
    id: 'clay',
    color: '#a8482c',
    label: { en: 'Clay red', ar: 'أحمر طيني' },
  },
  ink: {
    id: 'ink',
    color: '#22324f',
    label: { en: 'Ink blue', ar: 'أزرق حبري' },
  },
};

export default STOCKS;
