/**
 * The studio's own strings, in Arabic.
 *
 * Implements the same shape as `en.js`. See that file for what belongs here
 * and what belongs to a tenant.
 */

export default {
  panelLabel: 'إعدادات المنتج',
  sections: {
    stock: 'الخامة',
    artwork: 'تصميمك',
    placement: 'الموضع',
    details: 'التفاصيل',
  },
  rail: { stock: 'اللون', artwork: 'الشعار', placement: 'الموضع', details: 'معلومات' },
  drawer: {
    label: 'أدوات الاستوديو',
    show: 'إظهار أدوات التحكم',
    hide: 'إخفاء أدوات التحكم',
    close: 'إغلاق اللوحة',
  },
  stock: {
    label: 'الخامة',
    custom: 'لون مخصص',
  },
  chooseProduct: 'اختر منتجًا',
  comingSoon: 'قريبًا',
  modelInPreparation: 'النموذج قيد الإعداد',
  downloadProof: 'حمّل البروفة',
  referenceGeometry: 'نموذج مرجعي — يُستبدل بنموذج الإنتاج المعتمد فور توفره.',
  orbitHint: 'اسحب للتدوير · مرّر للتقريب',
  orbitHintTouch: 'اسحب للتدوير · اقرص للتقريب',
  undo: 'تراجع',
  redo: 'إعادة',
  placementEmpty: 'أضف تصميمك لتحديد موضعه على المنتج.',
  specs: 'المواصفات',
  guidance: 'إرشادات الطباعة',
  dropzone: {
    title: 'أفلت شعارك هنا',
    titleTouch: 'أضف شعارك',
    hint: 'PNG · JPG · WEBP · SVG · حتى 25 ميجابايت',
    reading: 'جارٍ قراءة الملف…',
    upload: 'ارفع شعارك أو تصميمك',
    replace: 'استبدال',
    remove: 'إزالة',
    removeLabel: 'إزالة التصميم',
  },
  preview: {
    emptyLabel: 'مساحة الطباعة · خامة غير مطبوعة',
    seam: 'الوصلة',
    safeArea: 'المساحة الآمنة',
    lowForPrint: 'دقة منخفضة للطباعة',
    dragLabel: 'مساحة الطباعة. اسحب لتحريك تصميمك، أو استخدم مفاتيح الأسهم.',
    emptyAria: 'مساحة الطباعة، فارغة حاليًا.',
  },
  controls: {
    size: 'الحجم',
    across: 'يمينًا ويسارًا',
    upDown: 'أعلى وأسفل',
    turn: 'الدوران',
    repeat: 'التكرار حول المنتج',
    once: 'مرة واحدة',
    fitHeight: 'ملء الارتفاع',
    centre: 'توسيط',
    crop: 'اقتصاص',
    doneCropping: 'تم الاقتصاص',
    reset: 'إعادة ضبط',
  },
  crop: {
    area: 'مساحة الاقتصاص',
    trim: 'قص الحواف',
    whole: 'استخدم الصورة كاملة',
    note: 'اسحب من الداخل للتحريك · اسحب من الزاوية لتغيير الحجم',
    noteTouch: 'اسحب من الداخل للتحريك · اسحب من الزاوية لتغيير الحجم',
  },
  errors: {
    type: 'صيغة الملف غير مدعومة. استخدم PNG أو JPG أو WEBP أو SVG.',
    size: 'حجم الملف يتجاوز 25 ميجابايت. صدّر نسخة أصغر وحاول مجددًا.',
    decode: 'تعذّرت قراءة الصورة. قد تكون تالفة أو بترميز غير معتاد.',
    empty: 'لم يصلنا أي ملف.',
    unknown: 'حدث خطأ أثناء قراءة الملف.',
  },
};
