import paperCup from './paperCup';
import shoppingBag from './shoppingBag';
import giftBox from './giftBox';
import mailerPackage from './mailerPackage';
import upcomingProducts from './upcoming';

/**
 * Central product registry.
 *
 * `liveProducts` are fully configured and selectable in the studio.
 * `catalogue` additionally includes announced-but-unbuilt products so the
 * picker can show the full range honestly.
 */

export const liveProducts = [paperCup, shoppingBag, giftBox, mailerPackage];

export const catalogue = [...liveProducts, ...upcomingProducts].sort(
  (a, b) => (a.order ?? 999) - (b.order ?? 999)
);

export const defaultProductId = paperCup.id;

/** Products the hero cycles through — live ones, in catalogue order. */
export const showcaseProducts = catalogue.filter((p) => p.status === 'live');

/** @returns {import('./schema').ProductConfig | undefined} */
export function getProduct(id) {
  return liveProducts.find((p) => p.id === id);
}

/** @returns {import('./schema').ProductConfig | undefined} */
export function getProductBySlug(slug) {
  return liveProducts.find((p) => p.slug === slug);
}

export function isLive(id) {
  return liveProducts.some((p) => p.id === id);
}

/** The stock palette a product offers, falling back to its single stock. */
export function paletteFor(product) {
  return (
    product?.print?.stockPalette ?? [
      { id: 'stock', color: product?.print?.stockColor ?? '#f7f5f1', label: 'Stock' },
    ]
  );
}

export { paperCup, shoppingBag, giftBox, mailerPackage, upcomingProducts };
