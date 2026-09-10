/**
 * Products the studio will support once their models are approved.
 *
 * These are deliberately real entries rather than filler: they render in the
 * picker as unavailable, which communicates the roadmap without pretending the
 * experience is finished. Promote one by giving it a `model` block and setting
 * `status: 'live'`.
 */

/** @type {Partial<import('./schema').ProductConfig>[]} */
export const upcomingProducts = [
  {
    id: 'mailer-box',
    slug: 'mailer-box',
    name: 'Corrugated mailer box',
    shortName: 'Mailer box',
    category: 'Shipping',
    status: 'coming-soon',
    order: 50,
    summary: 'E-flute mailer with full outer print and an optional printed interior.',
    translations: {
      ar: {
        name: 'علبة شحن مضلعة',
        shortName: 'علبة شحن',
        category: 'الشحن',
        summary: 'علبة كرتون مضلع بطباعة خارجية كاملة، مع طباعة داخلية اختيارية.',
      },
    },
  },
  {
    id: 'tote-canvas',
    slug: 'canvas-tote',
    name: 'Canvas tote',
    shortName: 'Canvas tote',
    category: 'Merchandise',
    status: 'coming-soon',
    order: 60,
    summary: '10 oz cotton canvas, screen printed one or two positions.',
    translations: {
      ar: {
        name: 'حقيبة قماش',
        shortName: 'حقيبة قماش',
        category: 'المنتجات الترويجية',
        summary: 'قماش قطني 10 أونصات، طباعة شاشة حريرية في موضع أو موضعين.',
      },
    },
  },
];

export default upcomingProducts;
