/**
 * Corrugated mailer box — live product.
 *
 * @type {import('./schema').ProductConfig}
 */
export const mailerBox = {
  id: 'mailer-box',
  slug: 'mailer-box',
  name: 'Corrugated mailer box',
  shortName: 'Mailer box',
  category: 'Shipping',
  status: 'live',
  order: 40,

  summary:
    'E-flute mailer with full outer print and an optional printed interior.',

  specs: [
    { label: 'Size', value: '300 × 220 × 100 mm' },
    { label: 'Stock', value: 'E-flute corrugated, 450 gsm' },
    { label: 'Print', value: 'Digital or offset, exterior + interior' },
    { label: 'Finish', value: 'Matte or gloss lamination on outer' },
    { label: 'Minimum run', value: '100 units' },
  ],

  model: {
    url: '/models/package1.glb',
    printMeshName: 'BoxBody',
    proxy: null,
    scale: 1,
    yOffset: -0.02,
    heightM: 0.22,
  },

  camera: {
    position: [0.38, 0.22, 0.55],
    target: [0, 0.01, 0],
    fov: 28,
    minDistance: 0.28,
    maxDistance: 1.1,
    minPolarAngle: 0.25,
    maxPolarAngle: 1.88,
  },

  print: {
    texture: { width: 2560, height: 1024 },
    uv: { x: 0, y: 0.05, width: 1, height: 0.88 },
    physical: { widthMm: 300, heightMm: 220, bleedMm: 3, safeMm: 5 },
    wrap: false,
    stockColor: '#e8e2d8',
    defaultTransform: { scale: 0.46, x: 0, y: 0, rotation: 0, repeat: 1 },
  },

  material: {
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.75,
  },

  guidance: [
    'The corrugated texture reads through lamination — account for this at design stage.',
    'Interior print is a separate file, set up on the interior dieline.',
    'Upload at 300 dpi or better for a true-to-press result.',
  ],

  translations: {
    ar: {
      name: 'علبة شحن مضلعة',
      shortName: 'علبة شحن',
      category: 'الشحن',
      summary: 'علبة كرتون مضلع بطباعة خارجية كاملة، مع طباعة داخلية اختيارية.',
      specs: [
        { label: 'المقاس', value: '300 × 220 × 100 ملم' },
        { label: 'الخامة', value: 'كرتون مضلع E-flute، 450 جم/م²' },
        { label: 'الطباعة', value: 'رقمية أو أوفست، خارجي وداخلي' },
        { label: 'التشطيب', value: 'تغليف مطفي أو لامع على الوجه الخارجي' },
        { label: 'أقل كمية', value: '100 وحدة' },
      ],
      guidance: [
        'نسيج التموج يظهر من خلال التغليف — خذ هذا في الاعتبار في مرحلة التصميم.',
        'الطباعة الداخلية ملف منفصل، يُعدّ على مخطط قص الجانب الداخلي.',
        'ارفع الملف بدقة 300 نقطة/بوصة أو أعلى للحصول على نتيجة مطابقة للمطبعة.',
      ],
    },
  },
};

export default mailerBox;
