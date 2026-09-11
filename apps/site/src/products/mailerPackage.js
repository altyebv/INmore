import { stockPalette, STOCKS } from './stock';

/**
 * Flat-bottom takeaway package.
 *
 * Like the other library models, its UV atlas is not a print layout, so the
 * print panel is projected onto the front face.
 */

/** @type {import('./schema').ProductConfig} */
export const mailerPackage = {
  id: 'takeaway-package',
  slug: 'takeaway-package',
  name: 'Flat-bottom takeaway package',
  shortName: 'Takeaway package',
  category: 'Food packaging',
  status: 'live',
  order: 40,

  summary:
    'Greaseproof-lined flat-bottom bag for food service. Printed on the roll before forming, so the artwork runs edge to edge.',

  specs: [
    { label: 'Size', value: '180 × 300 × 110 mm' },
    { label: 'Stock', value: 'Kraft with greaseproof liner' },
    { label: 'Print', value: 'Flexo, up to 4 colours' },
    { label: 'Food safe', value: 'Yes — direct contact approved' },
    { label: 'Minimum run', value: '2,000 units' },
  ],

  model: {
    url: '/models/package1.glb',
    printMeshName: 'material_0',
    stockMeshes: ['material_0'],
    proxy: null,
    scale: 1,
    yOffset: 0,
    heightM: 0.3,
  },

  camera: {
    position: [0.45, 0.26, 1],
    target: [0, 0, 0],
    fov: 26,
    framing: 1.5,
    minPolarAngle: 0.3,
    maxPolarAngle: 1.9,
  },

  print: {
    mode: 'decal',
    projection: {
      axis: 'z',
      up: 'y',
      threshold: 0.75,
      inset: 0.05,
      liftMm: 0.4,
    },

    texture: { width: 1600, height: 2048 },
    uv: { x: 0, y: 0, width: 1, height: 1 },
    physical: { widthMm: 180, heightMm: 300, bleedMm: 3, safeMm: 8 },
    wrap: false,
    stockColor: STOCKS.natural.color,
    stockPalette: stockPalette('natural', 'white', 'sand', 'clay', 'forest', 'black'),
    defaultTransform: { scale: 0.6, x: 0, y: -0.1, rotation: 0, repeat: 1 },
  },

  material: { roughness: 0.82, metalness: 0, envMapIntensity: 0.85 },

  guidance: [
    'Flexo printing holds solid colour well and fine detail less well — keep type above 6 pt.',
    'The bottom third of the panel is folded under when the bag stands, so keep logos high.',
    'Anything inside the dotted guide is guaranteed to print.',
  ],

  translations: {
    ar: {
      name: 'كيس طعام بقاعدة مسطحة',
      shortName: 'كيس طعام',
      category: 'تغليف الأغذية',
      summary:
        'كيس بقاعدة مسطحة مبطَّن ومقاوم للدهون لخدمات الطعام. يُطبع على البكرة قبل التشكيل، فتمتد الطباعة من حافة إلى حافة.',
      specs: [
        { label: 'المقاس', value: '180 × 300 × 110 مم' },
        { label: 'الخامة', value: 'كرافت ببطانة مقاومة للدهون' },
        { label: 'الطباعة', value: 'فلكسو، حتى 4 ألوان' },
        { label: 'آمن غذائيًا', value: 'نعم — معتمد للتلامس المباشر' },
        { label: 'أقل كمية', value: '2,000 وحدة' },
      ],
      guidance: [
        'طباعة الفلكسو تجيد الألوان الصلبة أكثر من التفاصيل الدقيقة — أبقِ حجم الخط فوق 6 نقاط.',
        'الثلث السفلي من الوجه ينطوي عند وقوف الكيس، فارفع الشعار للأعلى.',
        'كل ما يقع داخل الإطار المنقّط مضمون الطباعة.',
      ],
    },
  },
};

export default mailerPackage;
