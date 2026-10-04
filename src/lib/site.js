/**
 * The site's public origin — what canonical URLs, hreflang alternates, the
 * sitemap and share images are written against. A constant rather than
 * `window.location.origin`, so a preview deployment never names itself as the
 * canonical home of a page, and so the build can write the same URLs the
 * browser will.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://inmore.store').replace(/\/$/, '');

export default SITE_URL;
