import paperCup from './paperCup';
import bag from './bag';
import giftBox from './giftBox';
import mailerBox from './mailerBox';
import upcomingProducts from './upcoming';

/**
 * Central product registry.
 *
 * `liveProducts` are fully configured and selectable in the studio.
 * `catalogue` additionally includes announced-but-unbuilt products so the
 * picker can show the full range honestly.
 */

export const liveProducts = [paperCup, bag, giftBox, mailerBox];

// Upcoming entries whose ids are now live are excluded to avoid duplicates.
const upcomingFiltered = upcomingProducts.filter(
  (u) => !liveProducts.some((l) => l.id === u.id)
);

export const catalogue = [...liveProducts, ...upcomingFiltered].sort(
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

export { paperCup, bag, giftBox, mailerBox, upcomingProducts };
