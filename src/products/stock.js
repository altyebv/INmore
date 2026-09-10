/**
 * Stock colours.
 *
 * A print house does not sell "hex #F7F5F1", it sells board. These are named
 * stocks with the colours they actually come out as, so the studio offers a
 * real choice rather than a colour wheel — and a custom value stays available
 * for a client who is matching an existing brand colour.
 */

export const STOCKS = {
  white: { id: 'white', color: '#f7f5f1', label: 'White art board' },
  natural: { id: 'natural', color: '#c8ab84', label: 'Natural kraft' },
  sand: { id: 'sand', color: '#e0cdb2', label: 'Sand board' },
  slate: { id: 'slate', color: '#5c6068', label: 'Slate board' },
  black: { id: 'black', color: '#1c1b19', label: 'Black board' },
  forest: { id: 'forest', color: '#2f4a3c', label: 'Deep green' },
  clay: { id: 'clay', color: '#a8482c', label: 'Clay red' },
  ink: { id: 'ink', color: '#22324f', label: 'Ink blue' },
};

/** Convenience for building a product's palette from stock ids. */
export const stockPalette = (...ids) => ids.map((id) => STOCKS[id]);

export default STOCKS;
