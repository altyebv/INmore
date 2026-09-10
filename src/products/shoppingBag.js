import { stockPalette, STOCKS } from './stock';

/**
 * Kraft shopping bag with twisted handles.
 *
 * The model's UV atlas was authored for a photographic texture, not for print,
 * so this product prints by projection: see `print.mode` and `printSurface.js`.
 * The handles are a separate mesh and keep the material they were authored
 * with — they are cord, not board, and should not follow the stock colour.
 */

/** @type {import('./schema').ProductConfig} */
export const shoppingBag = {
  id: 'shopping-bag-paper',
  slug: 'paper-bag',
  name: 'Twisted-handle shopping bag',
  shortName: 'Shopping bag',
  category: 'Retail packaging',
  status: 'live',
  order: 20,

  summary:
    'Kraft or art-card bag with twisted paper handles, printed flat and glued. The front and back panels each take a full print.',

  specs: [
    { label: 'Size', value: '190 × 240 × 90 mm' },
    { label: 'Stock', value: 'Kraft or art card, 170 gsm' },
    { label: 'Print', value: 'Offset, up to 6 colours' },
    { label: 'Handle', value: 'Twisted paper, colour matched' },
    { label: 'Minimum run', value: '500 units' },
  ],

  model: {
    url: '/models/bag.glb',
    /** The bag body. Matched by material name — the mesh names are generic. */
    printMeshName: 'paper_cardboard_material8',
    /** Only the body follows the stock colour; the handles keep their own. */
    stockMeshes: ['paper_cardboard_material8'],
    proxy: null,
    scale: 1,
    yOffset: 0,
    /** Real height including handles. */
    heightM: 0.34,
  },

  camera: {
    position: [0.45, 0.28, 1],
    target: [0, 0, 0],
    fov: 26,
    framing: 1.5,
    minPolarAngle: 0.3,
    maxPolarAngle: 1.9,
  },

  print: {
    /** The authored UVs are not a print layout, so we build our own panel. */
    mode: 'decal',
    projection: {
      axis: 'z',
      up: 'y',
      /** Only near-flat, forward-facing triangles: keeps print off the gussets. */
      threshold: 0.8,
      /** Hold artwork away from the folded edges. */
      inset: 0.06,
      liftMm: 0.4,
    },

    texture: { width: 1600, height: 2048 },
    uv: { x: 0, y: 0, width: 1, height: 1 },
    physical: { widthMm: 190, heightMm: 240, bleedMm: 3, safeMm: 8 },
    wrap: false,
    stockColor: STOCKS.natural.color,
    stockPalette: stockPalette('natural', 'white', 'sand', 'black', 'forest', 'ink'),
    defaultTransform: { scale: 0.55, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  material: { roughness: 0.78, metalness: 0, envMapIntensity: 0.9 },

  guidance: [
    'The front panel is the print area — the back panel repeats it.',
    'Keep artwork inside the dotted guide; the edges of the panel are folds.',
    'Handles are colour matched separately, so they do not need to be in your file.',
  ],

  translations: {
    ar: {
      name: 'كيس تسوّق بمقبض مجدول',
      shortName: 'كيس تسوّق',
      category: 'تغليف التجزئة',
      summary:
        'كيس كرافت أو ورق فني بمقابض ورقية مجدولة، يُطبع مسطحًا ثم يُلصق. الوجه الأمامي والخلفي يستقبل كل منهما طباعة كاملة.',
      specs: [
        { label: 'المقاس', value: '190 × 240 × 90 مم' },
        { label: 'الخامة', value: 'كرافت أو ورق فني، 170 جم/م²' },
        { label: 'الطباعة', value: 'أوفست، حتى 6 ألوان' },
        { label: 'المقبض', value: 'ورق مجدول، مطابق للون' },
        { label: 'أقل كمية', value: '500 وحدة' },
      ],
      guidance: [
        'الوجه الأمامي هو مساحة الطباعة — والوجه الخلفي يكرّرها.',
        'أبقِ التصميم داخل الإطار المنقّط؛ حواف الوجه هي مواضع الطي.',
        'يُطابَق لون المقابض على حدة، فلا حاجة لإدراجها في ملفك.',
      ],
    },
  },
};

export default shoppingBag;
