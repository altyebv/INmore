/**
 * The products the website talks about.
 *
 * A trimmed copy of what the configurator's tenant config knows: names in both
 * languages, and just enough model detail to draw each product on the home
 * page. The configurator itself (Qreate) is reached through its embed and owns
 * the full config; this is presentation data and is edited here.
 */
export default [
  {
    "id": "paper-cup-8oz",
    "status": "live",
    "name": {
      "en": "Double-wall paper cup",
      "ar": "كوب ورقي مزدوج الجدار"
    },
    "shortName": {
      "en": "Paper cup",
      "ar": "كوب ورقي"
    },
    "category": {
      "en": "Beverage packaging",
      "ar": "تغليف المشروبات"
    },
    "model": {
      "yOffset": -0.005,
      "url": null,
      "heightM": 0.11,
      "stockMeshes": [
        "CupBody"
      ],
      "proxy": "paper-cup-proxy"
    },
    "material": {
      "roughness": 0.62,
      "metalness": 0,
      "envMapIntensity": 0.8,
      "sheen": 0.18
    },
    "palette": [
      "#f7f5f1",
      "#c8ab84",
      "#e0cdb2",
      "#1c1b19",
      "#2f4a3c",
      "#a8482c"
    ]
  },
  {
    "id": "shopping-bag-paper",
    "status": "live",
    "name": {
      "en": "Twisted-handle shopping bag",
      "ar": "كيس تسوّق بمقبض مجدول"
    },
    "shortName": {
      "en": "Shopping bag",
      "ar": "كيس تسوّق"
    },
    "category": {
      "en": "Retail packaging",
      "ar": "تغليف التجزئة"
    },
    "model": {
      "yOffset": 0,
      "url": "/models/bag.glb",
      "heightM": 0.34,
      "stockMeshes": [
        "paper_cardboard_material8"
      ],
      "proxy": null
    },
    "material": {
      "roughness": 0.78,
      "metalness": 0,
      "envMapIntensity": 0.9
    },
    "palette": [
      "#c8ab84",
      "#f7f5f1",
      "#e0cdb2",
      "#1c1b19",
      "#2f4a3c",
      "#22324f"
    ]
  },
  {
    "id": "gift-box-rigid",
    "status": "live",
    "name": {
      "en": "Rigid gift box",
      "ar": "علبة هدايا صلبة"
    },
    "shortName": {
      "en": "Gift box",
      "ar": "علبة هدايا"
    },
    "category": {
      "en": "Presentation packaging",
      "ar": "تغليف العرض"
    },
    "model": {
      "yOffset": 0,
      "url": "/models/gift-box.glb",
      "heightM": 0.19,
      "stockMeshes": [
        "gift_main",
        "gift_cap"
      ],
      "hiddenMeshes": [
        "tape"
      ],
      "proxy": null
    },
    "material": {
      "roughness": 0.55,
      "metalness": 0,
      "envMapIntensity": 1
    },
    "palette": [
      "#5c6068",
      "#1c1b19",
      "#f7f5f1",
      "#a8482c",
      "#2f4a3c",
      "#22324f"
    ]
  },
  {
    "id": "takeaway-package",
    "status": "live",
    "name": {
      "en": "Flat-bottom takeaway package",
      "ar": "كيس طعام بقاعدة مسطحة"
    },
    "shortName": {
      "en": "Takeaway package",
      "ar": "كيس طعام"
    },
    "category": {
      "en": "Food packaging",
      "ar": "تغليف الأغذية"
    },
    "model": {
      "yOffset": 0,
      "url": "/models/package1.glb",
      "heightM": 0.3,
      "stockMeshes": [
        "material_0"
      ],
      "proxy": null
    },
    "material": {
      "roughness": 0.82,
      "metalness": 0,
      "envMapIntensity": 0.85
    },
    "palette": [
      "#c8ab84",
      "#f7f5f1",
      "#e0cdb2",
      "#a8482c",
      "#2f4a3c",
      "#1c1b19"
    ]
  },
  {
    "id": "mailer-box",
    "status": "coming-soon",
    "name": {
      "en": "Corrugated mailer box",
      "ar": "علبة شحن مضلعة"
    },
    "shortName": {
      "en": "Mailer box",
      "ar": "علبة شحن"
    },
    "category": {
      "en": "Shipping",
      "ar": "الشحن"
    }
  },
  {
    "id": "tote-canvas",
    "status": "coming-soon",
    "name": {
      "en": "Canvas tote",
      "ar": "حقيبة قماش"
    },
    "shortName": {
      "en": "Canvas tote",
      "ar": "حقيبة قماش"
    },
    "category": {
      "en": "Merchandise",
      "ar": "المنتجات الترويجية"
    }
  }
];
