import { stockPalette, STOCKS } from './stock';

/**
 * Rigid gift box with a ribbon.
 *
 * Every face of this model shares one patch of UV space, so printing through
 * the authored UVs would put the same logo on all six sides at once. It prints
 * by projection onto the lid instead. The ribbon is a separate material and is
 * deliberately left out of both the stock colour and the print.
 */

/** @type {import('./schema').ProductConfig} */
export const giftBox = {
  id: 'gift-box-rigid',
  slug: 'gift-box',
  name: 'Rigid gift box',
  shortName: 'Gift box',
  category: 'Presentation packaging',
  status: 'live',
  order: 30,

  summary:
    'Two-piece rigid board box, wrapped and finished, with a fabric ribbon. The lid carries the print.',

  specs: [
    { label: 'Size', value: '220 × 220 × 150 mm' },
    { label: 'Construction', value: 'Two-piece rigid board, 1.5 mm grey board' },
    { label: 'Wrap', value: 'Printed art paper, matte laminated' },
    { label: 'Finish', value: 'Optional foil, spot UV or ribbon' },
    { label: 'Minimum run', value: '250 units' },
  ],

  model: {
    url: '/models/gift-box.glb',
    /** Box body. The lid shares its look; the ribbon does not. */
    printMeshName: 'gift_cap',
    stockMeshes: ['gift_main', 'gift_cap'],
    /**
     * The model ships with a ribbon crossing the lid, which sits exactly over
     * the print area. Ribbon is a finishing option we quote separately, so the
     * studio shows the box without it. Remove this line to put it back.
     */
    hiddenMeshes: ['tape'],
    proxy: null,
    scale: 1,
    yOffset: 0,
    heightM: 0.19,
  },

  camera: {
    /** Higher elevation: the lid is the printed face. */
    position: [0.55, 0.62, 1],
    target: [0, 0, 0],
    fov: 26,
    framing: 1.9,
    minPolarAngle: 0.25,
    maxPolarAngle: 1.4,
  },

  print: {
    mode: 'decal',
    projection: {
      /** The lid is printed from above. */
      axis: 'y',
      up: '-z',
      threshold: 0.85,
      inset: 0.1,
      liftMm: 0.4,
    },

    texture: { width: 2048, height: 2048 },
    uv: { x: 0, y: 0, width: 1, height: 1 },
    physical: { widthMm: 220, heightMm: 220, bleedMm: 3, safeMm: 10 },
    wrap: false,
    stockColor: STOCKS.slate.color,
    stockPalette: stockPalette('slate', 'black', 'white', 'clay', 'forest', 'ink'),
    defaultTransform: { scale: 0.5, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  material: { roughness: 0.55, metalness: 0, envMapIntensity: 1 },

  guidance: [
    'The lid is the print area — it is what the customer sees first.',
    'Ribbon is a finishing option, chosen and priced separately.',
    'Foil and spot UV are applied over this artwork, not instead of it.',
  ],

  translations: {
    ar: {
      name: 'علبة هدايا صلبة',
      shortName: 'علبة هدايا',
      category: 'تغليف العرض',
      summary:
        'علبة من قطعتين بكرتون صلب، مغلَّفة ومشطَّبة، مع شريط قماشي. الغطاء هو ما يحمل الطباعة.',
      specs: [
        { label: 'المقاس', value: '220 × 220 × 150 مم' },
        { label: 'التركيب', value: 'قطعتان من الكرتون الصلب، 1.5 مم' },
        { label: 'الغلاف', value: 'ورق فني مطبوع، تغليف مطفي' },
        { label: 'التشطيب', value: 'تذهيب أو ورنيش موضعي أو شريط، اختياري' },
        { label: 'أقل كمية', value: '250 وحدة' },
      ],
      guidance: [
        'الغطاء هو مساحة الطباعة — وهو أول ما يراه العميل.',
        'الشريط خيار تشطيب يُختار ويُسعَّر على حدة.',
        'يُضاف التذهيب والورنيش الموضعي فوق هذا التصميم، لا بديلًا عنه.',
      ],
    },
  },
};

export default giftBox;
