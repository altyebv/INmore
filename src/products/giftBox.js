/**
 * Gift box — live product.
 *
 * @type {import('./schema').ProductConfig}
 */
export const giftBox = {
  id: 'gift-box',
  slug: 'gift-box',
  name: 'Rigid gift box',
  shortName: 'Gift box',
  category: 'Premium packaging',
  status: 'live',
  order: 30,

  summary:
    'Rigid chipboard gift box with a lift-off lid, wrapped in printed art paper.',

  specs: [
    { label: 'Size', value: '200 × 150 × 80 mm' },
    { label: 'Stock', value: 'Rigid chipboard, 2 mm' },
    { label: 'Print', value: 'Offset-wrapped art paper' },
    { label: 'Finish', value: 'Soft touch, foil or gloss optional' },
    { label: 'Minimum run', value: '200 units' },
  ],

  model: {
    url: '/models/gift-box.glb',
    printMeshName: 'BoxBody',
    proxy: null,
    scale: 1,
    yOffset: -0.02,
    heightM: 0.2,
  },

  camera: {
    position: [0.35, 0.2, 0.5],
    target: [0, 0.01, 0],
    fov: 28,
    minDistance: 0.25,
    maxDistance: 1.0,
    minPolarAngle: 0.2,
    maxPolarAngle: 1.85,
  },

  print: {
    texture: { width: 2560, height: 1024 },
    uv: { x: 0, y: 0.04, width: 1, height: 0.9 },
    physical: { widthMm: 200, heightMm: 150, bleedMm: 3, safeMm: 5 },
    wrap: false,
    stockColor: '#eceae5',
    defaultTransform: { scale: 0.48, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  material: {
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 1.0,
  },

  guidance: [
    'Art wraps onto each panel — keep logos clear of the fold lines.',
    'Foil and emboss areas should be submitted as a separate spot layer.',
    'Upload at 300 dpi or better for a true-to-press result.',
  ],

  translations: {
    ar: {
      name: 'علبة هدايا صلبة',
      shortName: 'علبة هدايا',
      category: 'التغليف الفاخر',
      summary: 'علبة هدايا من الكرتون الصلب بغطاء منفصل، مغلَّفة بورق فني مطبوع.',
      specs: [
        { label: 'المقاس', value: '200 × 150 × 80 ملم' },
        { label: 'الخامة', value: 'كرتون صلب، سماكة 2 ملم' },
        { label: 'الطباعة', value: 'ورق فني مطبوع أوفست ملفوف' },
        { label: 'التشطيب', value: 'ملمس ناعم، تذهيب أو لمعة اختيارية' },
        { label: 'أقل كمية', value: '200 وحدة' },
      ],
      guidance: [
        'يلتف التصميم على كل وجه — أبعِد الشعارات عن خطوط الطي.',
        'يجب تقديم مناطق التذهيب والبروز في طبقة موضعية منفصلة.',
        'ارفع الملف بدقة 300 نقطة/بوصة أو أعلى للحصول على نتيجة مطابقة للمطبعة.',
      ],
    },
  },
};

export default giftBox;
