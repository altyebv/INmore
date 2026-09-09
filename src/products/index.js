import paperCup from './paperCup';
import upcomingProducts from './upcoming';

/**
 * Central product registry.
 *
 * `liveProducts` are fully configured and selectable in the studio.
 * `catalogue` additionally includes announced-but-unbuilt products so the
 * picker can show the full range honestly.
 */

export const liveProducts = [paperCup];

export const catalogue = [...liveProducts, ...upcomingProducts].sort(
  (a, b) => (a.order ?? 999) - (b.order ?? 999)
);

export const defaultProductId = paperCup.id;

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

export { paperCup, upcomingProducts };
