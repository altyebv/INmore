/**
 * English content.
 *
 * The shape of this module is the contract every locale implements. Structural
 * data that must not drift between languages — ids, order, hrefs, routes —
 * stays identical; only human-readable strings change.
 */

const email = 'hello@inmore.qa';
const phone = '+974 0000 0000';

export default {
  company: {
    name: 'INMORE',
    legalName: 'INMORE Advertising',
    location: 'Doha, Qatar',
    statement: 'We make design something you can hold.',
    email,
    phone,
    address: ['Doha', 'State of Qatar'],
  },

  nav: [
    { to: '/studio', label: 'Studio' },
    { to: '/work', label: 'Work' },
    { to: '/capabilities', label: 'Capabilities' },
    { to: '/contact', label: 'Contact' },
  ],

  footerColumns: [
    {
      title: 'Site',
      items: [
        { to: '/studio', label: 'Test your product' },
        { to: '/work', label: 'Work' },
        { to: '/capabilities', label: 'Capabilities' },
        { to: '/contact', label: 'Start a project' },
      ],
    },
    {
      title: 'Contact',
      items: [
        { href: `mailto:${email}`, label: email },
        { href: `tel:${phone.replace(/\s/g, '')}`, label: phone },
      ],
    },
  ],

  disciplines: [
    {
      id: 'brand',
      index: '01',
      title: 'Brand',
      summary:
        'Identity systems built to survive contact with the real world — ink, substrate, tolerance and all.',
      detail: ['Naming and positioning', 'Identity and logo systems', 'Brand guidelines', 'Art direction'],
    },
    {
      id: 'design',
      index: '02',
      title: 'Design',
      summary:
        'Structural and surface design for packaging, retail and campaigns, drawn against the press that will print it.',
      detail: ['Packaging design', 'Structural dielines', 'Campaign artwork', 'Print-ready artwork'],
    },
    {
      id: 'production',
      index: '03',
      title: 'Production',
      summary:
        'Offset and digital printing, die-cutting, lamination, foiling and finishing, run to spec and to date.',
      detail: ['Offset and digital print', 'Die-cutting and forming', 'Foiling and embossing', 'Lamination and coating'],
    },
    {
      id: 'delivery',
      index: '04',
      title: 'Delivery',
      summary:
        'Prototyping, press approvals, quality control and delivery across Qatar and the wider Gulf.',
      detail: ['Physical prototypes', 'Press proofing', 'Quality control', 'Fulfilment'],
    },
  ],

  process: [
    { step: '01', title: 'Brief', body: 'Quantity, substrate, finish, deadline. What it has to survive.' },
    { step: '02', title: 'Artwork', body: 'Design or adaptation, laid out on the dieline that will be cut.' },
    { step: '03', title: 'Proof', body: 'A physical sample in your hands before the run is committed.' },
    { step: '04', title: 'Press', body: 'The run, monitored sheet by sheet against the approved proof.' },
    { step: '05', title: 'Finish', body: 'Cutting, forming, lamination, packing and delivery.' },
  ],

  chain: [
    { index: '01', title: 'A file', body: 'A logo, a layout, an idea. Vector or pixels, it starts flat.' },
    { index: '02', title: 'A surface', body: 'Laid onto the dieline that will actually be cut and formed.' },
    { index: '03', title: 'A press', body: 'Ink onto stock, colour held to the proof you signed off.' },
    { index: '04', title: 'An object', body: 'Cut, formed, packed, delivered. Something a customer holds.' },
  ],

  work: [
    {
      id: 'cup-programme',
      client: 'Hospitality group',
      title: 'A cup programme across eleven venues',
      discipline: 'Packaging · Print',
      year: '2025',
      metric: '180,000 units',
      body: 'One stock, one press setup, eleven separate identities held to the same colour standard.',
    },
    {
      id: 'retail-launch',
      client: 'Retail brand',
      title: 'Launch packaging, shelf to street',
      discipline: 'Brand · Structural design',
      year: '2025',
      metric: '9 SKUs',
      body: 'Structural design, dielines and finished production for a full launch range.',
    },
    {
      id: 'event-system',
      client: 'Cultural institution',
      title: 'A printed system for a season of events',
      discipline: 'Design · Production',
      year: '2024',
      metric: '24 formats',
      body: 'Signage, print collateral and takeaway pieces produced from a single grid.',
    },
    {
      id: 'fnb-rollout',
      client: 'F&B group',
      title: 'Takeaway rebuilt around one dieline',
      discipline: 'Packaging',
      year: '2024',
      metric: '4 formats',
      body: 'A bag, a cup, a sleeve and a wrap, engineered to share tooling and stock.',
    },
  ],

  capabilitySpecs: [
    { label: 'Print methods', value: 'Offset, digital, screen, pad' },
    { label: 'Finishes', value: 'Matte and gloss lamination, soft touch, spot UV, foil, emboss' },
    { label: 'Substrates', value: 'Board, kraft, art paper, corrugate, food-grade stock' },
    { label: 'Formats', value: 'Cups, bags, boxes, sleeves, wraps, labels, signage' },
    { label: 'Minimum runs', value: 'From 1,000 units depending on format' },
    { label: 'Lead time', value: 'Typically 10–15 working days after proof approval' },
  ],

  ui: {
    common: {
      testYourProduct: 'Test your product',
      openStudio: 'Open the studio',
      seeAllWork: 'See all work',
      skipToContent: 'Skip to content',
      home: 'INMORE — home',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      language: 'Language',
      switchLanguage: 'العربية',
      reload: 'Reload',
    },

    home: {
      title: 'INMORE — Design, made physical',
      description:
        'INMORE is a Qatar-based advertising, branding and production house. We take a design and make it something you can hold.',
      eyebrow: 'Advertising · Branding · Production · Doha',
      headlineLead: 'Design,',
      headlineEmphasis: 'made physical.',
      lede:
        'We design brands and then produce them — printed, cut, formed and delivered across Qatar. Bring your logo and put it on something real.',
      scroll: 'Scroll',
      carouselLabel: 'Products',
      previousProduct: 'Previous product',
      nextProduct: 'Next product',
      showProduct: 'Show {product}',
      chainEyebrow: 'Flat to formed',
      chainTitle: 'Four steps between a file and a thing you can hold.',
      inviteEyebrow: 'The studio',
      inviteTitle: "Don't take our word for it. Put your logo on it.",
      inviteBody:
        'Upload your artwork, size it, place it, and turn the product in your hands. It is the same layout our press would receive — and you can take the proof away with you.',
      disciplinesEyebrow: 'What we do',
      disciplinesTitle: 'Four disciplines, one building.',
      workEyebrow: 'Selected work',
      workTitle: 'Runs we have printed.',
      workLede:
        'Case studies are being prepared with each client. The work itself is listed here as it left the building.',
      processEyebrow: 'How a job moves',
      processTitle: 'Brief to delivery.',
    },

    studio: {
      title: 'Test your product — INMORE',
      description:
        'Upload your logo, place it on a real product and turn it in your hands before anything is printed.',
      eyebrow: 'Test your product',
      heading: 'See it before we make it',
      lede:
        'Upload your logo, place it on the product, and turn it in your hands. What you arrange here is the layout we would print.',
      talkToUs: 'Talk to us about a run',
    },

    work: {
      title: 'Work — INMORE',
      description: 'Branding, packaging and print production delivered from Doha.',
      eyebrow: 'Work',
      heading: 'Printed, formed, delivered.',
      lede:
        'A selection of recent production. Full case studies, with photography, are released as each client approves them.',
      noteTitle: 'Want to see your own brand on one of these?',
      noteBody:
        'The studio lets you place your logo on a real product and take the layout away as a proof — no brief, no meeting, no wait.',
    },

    capabilities: {
      title: 'Capabilities — INMORE',
      description:
        'Print methods, finishes, substrates and formats produced in-house by INMORE in Doha, Qatar.',
      eyebrow: 'Capabilities',
      heading: 'Everything between the idea and the pallet.',
      lede:
        'Design and production sit in the same building, which is why colour holds, deadlines hold and there is nobody to hand the problem to.',
      specEyebrow: 'Specification',
      specTitle: 'What we run.',
      processEyebrow: 'Process',
      processTitle: 'Five stages, no surprises.',
      cta: 'Try it on a product',
    },

    contact: {
      title: 'Contact — INMORE',
      description: 'Start a project with INMORE — branding, design and production in Doha, Qatar.',
      eyebrow: 'Contact',
      heading: 'Tell us what you need made.',
      lede:
        'Quantity, format, deadline — that is usually enough for us to come back with a route and a price. If you have artwork already, bring it.',
      emailLabel: 'Email',
      phoneLabel: 'Telephone',
      studioLabel: 'Studio',
      fields: {
        name: 'Name',
        company: 'Company',
        email: 'Email',
        product: 'Product',
        quantity: 'Quantity',
        message: 'What are we making?',
        productUnsure: 'Not sure yet',
        productOther: 'Something else',
        quantityPlaceholder: 'e.g. 5,000',
      },
      submit: 'Send enquiry',
      sending: 'Sending…',
      subject: 'Project enquiry',
      sent: 'Thank you — we will come back to you within one working day.',
      failed: 'That did not send. Please email us directly and we will pick it up.',
      mailtoOpened: 'Your email client should now be open with the enquiry ready to send.',
      noBackendHint: 'This opens your email client so nothing is stored on our side yet.',
    },

    notFound: {
      title: 'Not found — INMORE',
      code: '404',
      heading: 'This page was never printed.',
      body: 'The link may be old, or the page may still be in production.',
      back: 'Back to the start',
    },

    error: {
      eyebrow: 'Something broke',
      heading: 'This part of the site did not load.',
    },
  },
};
