/**
 * Laminated paper bag — live product.
 *
 * @type {import('./schema').ProductConfig}
 */
export const bag = {
  id: 'shopping-bag-paper',
  slug: 'paper-bag',
  name: 'Laminated paper bag',
  shortName: 'Paper bag',
  category: 'Retail packaging',
  status: 'live',
  order: 20,

  summary:
    'Twisted-handle kraft or art-card bag, printed on both faces and gussets.',

  specs: [
    { label: 'Size', value: '320 × 270 × 110 mm' },
    { label: 'Stock', value: 'Art card, 250 gsm' },
    { label: 'Print', value: 'Offset, up to 6 colours' },
    { label: 'Finish', value: 'Matte or gloss lamination' },
    { label: 'Minimum run', value: '500 units' },
  ],

  model: {
    url: '/models/bag.glb',
    printMeshName: 'BagBody',
    proxy: null,
    scale: 1,
    yOffset: -0.02,
    heightM: 0.32,
  },

  camera: {
    position: [0.4, 0.2, 0.6],
    target: [0, 0.02, 0],
    fov: 28,
    minDistance: 0.3,
    maxDistance: 1.2,
    minPolarAngle: 0.3,
    maxPolarAngle: 1.9,
  },

  print: {
    texture: { width: 2560, height: 1024 },
    uv: { x: 0, y: 0.05, width: 1, height: 0.88 },
    physical: { widthMm: 320, heightMm: 270, bleedMm: 3, safeMm: 5 },
    wrap: false,
    stockColor: '#f0ece4',
    defaultTransform: { scale: 0.45, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  material: {
    roughness: 0.55,
    metalness: 0,
    envMapIntensity: 0.9,
  },

  guidance: [
    'The front and back panels are separate print areas — keep key art centred on each face.',
    'Stay inside the safe-area guides to avoid the gusset folds.',
    'Upload at 300 dpi or better for a true-to-press result.',
  ],

  translations: {
    ar: {
      name: 'كيس ورقي مغلَّف',
      shortName: 'كيس ورقي',
      category: 'تغليف التجزئة',
      summary: 'كيس كرافت أو ورق فني بمقبض مجدول، يُطبع على الوجهين والجانبين.',
      specs: [
        { label: 'المقاس', value: '320 × 270 × 110 ملم' },
        { label: 'الخامة', value: 'ورق فني، 250 جم/م²' },
        { label: 'الطباعة', value: 'أوفست، حتى 6 ألوان' },
        { label: 'التشطيب', value: 'تغليف مطفي أو لامع' },
        { label: 'أقل كمية', value: '500 وحدة' },
      ],
      guidance: [
        'الوجه الأمامي والخلفي مساحتا طباعة منفصلتان — أبقِ العناصر الرئيسية في مركز كل وجه.',
        'ابقَ داخل الإطارات الإرشادية لتتجنب طيّات الجانبين.',
        'ارفع الملف بدقة 300 نقطة/بوصة أو أعلى للحصول على نتيجة مطابقة للمطبعة.',
      ],
    },
  },
};

export default bag;
