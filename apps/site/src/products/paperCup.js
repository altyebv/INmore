
/**
 * Paper cup — the first fully implemented product.
 *
 * Everything the studio needs to render, print onto and describe a product
 * lives in one config object. Adding a product means adding a file like this
 * one and registering it in `src/products/index.js` — no application code
 * should need to change.
 */

/** @type {import('./schema').ProductConfig} */
export const paperCup = {
  id: 'paper-cup-8oz',
  slug: 'paper-cup',
  name: 'Double-wall paper cup',
  shortName: 'Paper cup',
  category: 'Beverage packaging',
  status: 'live',
  order: 10,

  summary:
    'Food-grade double-wall stock, offset printed and die-cut flat, then rolled and seamed. The print wraps the full body between the rim curl and the base.',

  specs: [
    { label: 'Volume', value: '8 oz / 240 ml' },
    { label: 'Stock', value: 'Double wall, 300 gsm' },
    { label: 'Print', value: 'Offset, up to 6 colours' },
    { label: 'Finish', value: 'Matte or gloss lamination' },
    { label: 'Minimum run', value: '1,000 units' },
  ],

  /* --- Geometry source ---------------------------------------------------- */
  model: {
    /**
     * Production model. Drop the approved, UV-unwrapped GLB at this path and
     * the studio picks it up automatically — see public/models/README.md.
     */
    url: '/models/paper-cup.glb',
    stockMeshes: ['CupBody'],
    /** Mesh (or material) inside the GLB that carries the printable wrap. */
    printMeshName: 'CupBody',
    /**
     * Geometry used while the approved GLB is not present. It implements the
     * same print-surface contract, so the studio behaves identically either
     * way and swapping in the GLB changes nothing but fidelity.
     */
    proxy: 'paper-cup-proxy',
    scale: 1,
    /** Vertical nudge so the product sits centred in frame. */
    yOffset: -0.005,
    /** Approximate real-world height in metres, for camera framing. */
    heightM: 0.11,
  },

  /* --- Framing ------------------------------------------------------------- */
  camera: {
    /** A viewing direction, not a distance — see `three/framing.js`. */
    position: [0.5, 0.3, 1],
    target: [0, 0, 0],
    fov: 26,
    framing: 1.7,
    minPolarAngle: 0.35,
    maxPolarAngle: 1.95,
  },

  /* --- Print surface ------------------------------------------------------- */
  print: {
    /**
     * The cup's model is authored with a flat, unrolled print layout, so the
     * artwork is simply its texture. Products whose UVs are not a print layout
     * use `mode: 'decal'` instead — see `printSurface.js`.
     */
    mode: 'texture',

    /**
     * The printable window inside the mesh's UV space (0–1, origin top-left).
     * Everything outside it is stock colour and cannot receive artwork.
     */
    uv: { x: 0, y: 0.06, width: 1, height: 0.8 },

    /**
     * Real dimensions of the flat, unrolled print area. These are the
     * coordinate system: the texture's resolution is derived from them, so a
     * millimetre is a millimetre on both axes.
     */
    physical: {
      widthMm: 250,
      heightMm: 92,
      bleedMm: 3,
      // The rim curl takes more off the top than the base takes off the bottom.
      safeMm: { top: 7, right: 5, bottom: 5, left: 5 },
    },

    /** The artwork wraps continuously — left and right edges meet at the seam. */
    wrap: true,

    /** Default stock, by id. Resolved to a colour by the catalogue. */
    stock: 'white',

    /** Stocks this product is actually available in, by id. */
    stockPalette: ['white', 'natural', 'sand', 'black', 'forest', 'clay'],

    /**
     * Fractions of the print area, not millimetres — the one proportion that
     * is a product's own opinion whatever its real size. Resolved to
     * millimetres once, when a placement is created.
     */
    defaultTransform: { width: 0.42, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  /* --- Surface response ---------------------------------------------------- */
  material: {
    roughness: 0.62,
    metalness: 0,
    envMapIntensity: 0.8,
    /** Subtle paper tooth. Kept low so uploaded artwork stays readable. */
    sheen: 0.18,
  },

  /* --- Studio copy --------------------------------------------------------- */
  guidance: [
    'Keep logos clear of the seam — the left and right edges of your artwork meet on the back of the cup.',
    'Anything inside the dotted guide is guaranteed to print.',
    'Upload at 300 dpi or better for a true-to-press result.',
  ],

  /* --- Localised display strings ------------------------------------------- */
  translations: {
    ar: {
      name: 'كوب ورقي مزدوج الجدار',
      shortName: 'كوب ورقي',
      category: 'تغليف المشروبات',
      summary:
        'خامة ورقية آمنة غذائيًا مزدوجة الجدار، تُطبع أوفست وتُقص مسطحة ثم تُلف وتُلحم. تلتف الطباعة حول الجسم كاملًا بين حافة الفم والقاعدة.',
      specs: [
        { label: 'السعة', value: '8 أونصات / 240 مل' },
        { label: 'الخامة', value: 'جدار مزدوج، 300 جم/م²' },
        { label: 'الطباعة', value: 'أوفست، حتى 6 ألوان' },
        { label: 'التشطيب', value: 'تغليف مطفي أو لامع' },
        { label: 'أقل كمية', value: '1,000 وحدة' },
      ],
      guidance: [
        'أبعِد الشعار عن الوصلة — تلتقي حافتا تصميمك عند ظهر الكوب.',
        'كل ما يقع داخل الإطار المنقّط مضمون الطباعة.',
        'ارفع الملف بدقة 300 نقطة/بوصة أو أعلى للحصول على نتيجة مطابقة للمطبعة.',
      ],
    },
  },
};

export default paperCup;
