import products from '@/data/products';

/**
 * The website's view of the product range.
 *
 * Only what the marketing pages need: what exists, which are live, and which
 * the hero shows. The configurator owns the authoritative product config.
 */
const live = products.filter((product) => product.status === 'live');

export const catalogue = {
  all: products,
  live,
  showcase: live,
};

export default catalogue;
