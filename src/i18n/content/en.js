/**
 * English content.
 *
 * The shape of this module is the contract every locale implements. Structural
 * data that must not drift between languages — ids, order, hrefs, routes —
 * stays identical; only human-readable strings change.
 */

const email = 'hello@inmore.qa';
const phone = '+974 5199 9340';

export default {
  company: {
    name: 'INMORE',
    legalName: 'INMORE Advertising',
    location: 'Doha, Qatar',
    statement: 'We turn brands into printed things people notice, keep and carry.',
    email,
    phone,
    address: ['Doha', 'State of Qatar'],
  },

  nav: [
    { to: '/studio', label: 'Studio' },
    { to: '/work', label: 'Work' },
    { to: '/capabilities', label: 'Capabilities' },
    { to: '/order', label: 'Order' },
    { to: '/contact', label: 'Contact' },
  ],

  footerColumns: [
    {
      title: 'Site',
      items: [
        { to: '/studio', label: 'Preview your product' },
        { to: '/work', label: 'Work' },
        { to: '/capabilities', label: 'Capabilities' },
        { to: '/order', label: 'Place an order' },
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
        'Identity systems shaped for the real world: signs, boxes, cups, bags and every printed touchpoint in between.',
      detail: ['Naming and positioning', 'Logo and identity systems', 'Brand guidelines', 'Art direction'],
    },
    {
      id: 'design',
      index: '02',
      title: 'Design',
      summary:
        'Packaging, retail and campaign artwork designed with the final material, fold, finish and press in mind.',
      detail: ['Packaging design', 'Structural dielines', 'Campaign artwork', 'Press-ready files'],
    },
    {
      id: 'production',
      index: '03',
      title: 'Production',
      summary:
        'Offset and digital print, die-cutting, lamination, foil and finishing handled with care from proof to run.',
      detail: ['Offset and digital print', 'Die-cutting and forming', 'Foiling and embossing', 'Lamination and coating'],
    },
    {
      id: 'delivery',
      index: '04',
      title: 'Delivery',
      summary:
        'Samples, approvals, quality checks, packing and delivery across Qatar and the wider Gulf.',
      detail: ['Physical samples', 'Press proofing', 'Quality control', 'Fulfilment'],
    },
  ],

  process: [
    { step: '01', title: 'Brief', body: 'Tell us the product, quantity, finish and date. We shape the route from there.' },
    { step: '02', title: 'Artwork', body: 'We design or adapt the file onto the dieline that will actually be cut.' },
    { step: '03', title: 'Proof', body: 'You approve a clear proof, and when needed, a physical sample.' },
    { step: '04', title: 'Press', body: 'Colour, stock and finish are checked against the approved proof during production.' },
    { step: '05', title: 'Finish', body: 'The pieces are cut, formed, packed and delivered ready to hand over.' },
  ],

  chain: [
    { index: '01', title: 'A file', body: 'Your logo, layout or idea starts as a flat file.' },
    { index: '02', title: 'A surface', body: 'We place it on the cup, bag, box or sheet it will live on.' },
    { index: '03', title: 'A press', body: 'Ink meets stock, with colour and finish held to the proof.' },
    { index: '04', title: 'An object', body: 'It leaves as something useful, polished and ready for your customer.' },
  ],

  work: [
    {
      id: 'cup-programme',
      client: 'Hospitality group',
      title: 'A cup system across eleven venues',
      discipline: 'Packaging · Print',
      year: '2025',
      metric: '180,000 units',
      body: 'One stock and press setup, with eleven venue identities held to a consistent colour standard.',
    },
    {
      id: 'retail-launch',
      client: 'Retail brand',
      title: 'Launch packaging from shelf to street',
      discipline: 'Brand · Structural design',
      year: '2025',
      metric: '9 SKUs',
      body: 'Structural design, dielines and finished production for a full launch range customers could carry out.',
    },
    {
      id: 'event-system',
      client: 'Cultural institution',
      title: 'A printed system for a cultural season',
      discipline: 'Design · Production',
      year: '2024',
      metric: '24 formats',
      body: 'Signage, printed collateral and takeaway pieces produced from one flexible visual system.',
    },
    {
      id: 'fnb-rollout',
      client: 'F&B group',
      title: 'Takeaway packaging built around one dieline',
      discipline: 'Packaging',
      year: '2024',
      metric: '4 formats',
      body: 'A bag, cup, sleeve and wrap engineered to share tooling, stock and a recognisable brand rhythm.',
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
      testYourProduct: 'Preview your product',
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
      title: 'INMORE — Branding, print and production in Doha',
      description:
        'INMORE is a Doha-based advertising, branding and production house creating packaging, print and branded objects for businesses in Qatar.',
      eyebrow: 'Advertising · Branding · Packaging · Production',
      headlineLead: 'Your brand,',
      headlineEmphasis: 'made to be held.',
      lede:
        'We design, print and finish the branded things people meet in real life: boxes, bags, cups, stationery, uniforms and launch kits.',
      scroll: 'Scroll',
      carouselLabel: 'Products',
      previousProduct: 'Previous product',
      nextProduct: 'Next product',
      showProduct: 'Show {product}',
      galleryLabel: 'The range',
      previousGallery: 'Previous gallery item',
      nextGallery: 'Next gallery item',
      galleryEyebrow: 'Made around your brand',
      galleryTitle: 'Everyday things with a lasting presence.',
      galleryLede:
        'From the first printed impression to the object your customer carries away, we make every touchpoint feel intentional.',
      products: [
        {
          id: 'gift-boxes',
          image: '/assets/packages.jpeg',
          title: 'Gift boxes',
          body: 'Printed packaging with the weight, finish and presence a thoughtful gift deserves.',
          alt: 'Custom printed pink gift boxes with floral graphics',
        },
        {
          id: 'printed-stationery',
          image: '/assets/cards.jpeg',
          title: 'Printed stationery',
          body: 'Cards, folders and paper pieces that make every handover feel considered.',
          alt: 'Black and gold printed stationery arranged on a desk',
        },
        {
          id: 'custom-shirts',
          image: '/assets/shirts.jpeg',
          title: 'Custom shirts',
          body: 'Clean apparel printing for teams, launches, campaigns and events.',
          alt: 'White custom printed t-shirt featuring a Qatar National Day design',
        },
        {
          id: 'branded-bags',
          image: '/assets/bags.jpeg',
          title: 'Branded bags',
          body: 'Practical bags designed to keep your brand moving through the day.',
          alt: 'White promotional paper bag with a printed circular emblem',
        },
        {
          id: 'coffee-cups',
          image: '/assets/cups.jpeg',
          title: 'Coffee cups',
          body: 'Daily visibility for cafés, offices and hospitality brands, printed with care.',
          alt: 'Printed takeaway coffee cups arranged with coffee on a tray',
        },
        {
          id: 'office-kits',
          image: '/assets/notes.jpeg',
          title: 'Office kits',
          body: 'Notebooks, pens and desk essentials assembled into a set people actually use.',
          alt: 'Branded office stationery including notebooks, pens and folders',
        },
        {
          id: 'brand-cards',
          image: '/assets/cards2.jpeg',
          title: 'Cards & badges',
          body: 'Small-format pieces for recognition, promotion, events and everyday connection.',
          alt: 'Printed black business cards and presentation cards',
        },
        {
          id: 'event-shirts',
          image: '/assets/shirts2.jpeg',
          title: 'Event apparel',
          body: 'Wearable campaign pieces that make a team, launch or occasion feel unified.',
          alt: 'White custom printed event t-shirt',
        },
        {
          id: 'retail-bags',
          image: '/assets/bags2.jpeg',
          title: 'Retail bags',
          body: 'A final branded touch that keeps your business in view after the purchase.',
          alt: 'Printed white retail bag with a circular logo design',
        },
        {
          id: 'coffee-range',
          image: '/assets/cups2.jpeg',
          title: 'Cup ranges',
          body: 'Coordinated sizes and finishes that keep every service moment on-brand.',
          alt: 'A range of plain and printed paper cups',
        },
        {
          id: 'paper-collateral',
          image: '/assets/papers.jpeg',
          title: 'Paper collateral',
          body: 'Letters, folders and inserts that carry your message with clarity and polish.',
          alt: 'Branded papers, folders, notebooks and office supplies arranged together',
        },
        {
          id: 'promotional-bags',
          image: '/assets/bags3.jpeg',
          title: 'Promotional bags',
          body: 'Practical giveaways made to be used, carried and remembered.',
          alt: 'White promotional bag with a colourful printed emblem',
        },
      ],
      chainEyebrow: 'From screen to hand',
      chainTitle: 'How a flat idea becomes a finished object.',
      inviteEyebrow: 'The studio',
      inviteTitle: 'See your logo on the product before it goes to press.',
      inviteBody:
        'Upload your artwork, size it, place it, and turn the product in your hands. The preview gives our team a clear starting point for the real print.',
      disciplinesEyebrow: 'What we do',
      disciplinesTitle: 'Brand, design and production under one roof.',
      workEyebrow: 'Selected work',
      workTitle: 'Recent runs from the press.',
      workLede:
        'A quick look at the kind of work we design, produce and deliver for brands in Qatar.',
      processEyebrow: 'How a job moves',
      processTitle: 'A clear path from request to delivery.',
    },

    studio: {
      title: 'Preview your product — INMORE',
      description:
        'Upload your logo, place it on a real product and turn it in your hands before anything is printed.',
      eyebrow: 'Preview your product',
      heading: 'See it before we make it.',
      lede:
        'Upload your logo, place it on the product, and turn it in your hands. What you arrange here gives us the print direction to build from.',
      talkToUs: 'Talk to us about a run',
    },

    work: {
      title: 'Work — INMORE',
      description: 'Branding, packaging and print production delivered from Doha.',
      eyebrow: 'Work',
      heading: 'Printed work with a real-world finish.',
      lede:
        'A selection of recent production across packaging, events, hospitality and retail. Full case studies are added as each client approves them.',
      noteTitle: 'Want to see your brand on one of these?',
      noteBody:
        'The studio lets you place your logo on a real product and bring the preview into an order or conversation.',
    },

    capabilities: {
      title: 'Capabilities — INMORE',
      description:
        'Print methods, finishes, substrates and formats produced in-house by INMORE in Doha, Qatar.',
      eyebrow: 'Capabilities',
      heading: 'Everything between the idea and the delivery.',
      lede:
        'Design and production sit close together, so colour, material, finish and deadline are considered from the start.',
      specEyebrow: 'Specification',
      specTitle: 'What we produce.',
      processEyebrow: 'Process',
      processTitle: 'Five stages, clearly handled.',
      cta: 'Preview a product',
    },

    contact: {
      title: 'Contact — INMORE',
      description: 'Start a project with INMORE — branding, design and production in Doha, Qatar.',
      eyebrow: 'Contact',
      heading: 'Tell us what you need to make.',
      lede:
        'Product, quantity and deadline are enough to start. If you already have artwork, send it along and we will guide the next step.',
      emailLabel: 'Email',
      phoneLabel: 'Telephone',
      studioLabel: 'Studio',
      fields: {
        name: 'Name',
        company: 'Company',
        email: 'Email',
        product: 'Product',
        quantity: 'Quantity',
        message: 'What would you like to make?',
        productUnsure: 'Not sure yet',
        productOther: 'Something else',
        quantityPlaceholder: 'e.g. 5,000',
      },
      submit: 'Send enquiry',
      sending: 'Sending…',
      subject: 'Project enquiry',
      sent: 'Thank you — we will get back to you within one working day.',
      failed: 'That did not send. Please email us directly and we will follow up.',
      mailtoOpened: 'Your email client should now be open with the enquiry ready to send.',
      noBackendHint: 'This opens your email client so nothing is stored on our side yet.',
    },

    order: {
      title: 'Order — INMORE',
      description:
        'Order printed packaging from INMORE: choose your products and quantities, and we call you back to confirm.',
      eyebrow: 'Order',
      heading: 'Start your order.',
      lede:
        'Tell us what you need and how many. We call you to confirm the details and price before anything goes into production.',
      stepsTitle: 'What happens next',
      steps: [
        'Your request reaches our team straight away.',
        'We call you to confirm the product, details and price.',
        'Production starts once you approve.',
      ],
      fields: {
        name: 'Name',
        mobile: 'Mobile number',
        mobileHint: 'Your mobile number is enough — no account needed.',
        company: 'Company (optional)',
        items: 'Products',
        product: 'Product',
        productChoose: 'Choose a product',
        productOther: 'Something else',
        otherName: 'What is it?',
        quantity: 'Quantity',
        quantityPlaceholder: 'Quantity',
        notes: 'Notes (optional)',
        notesPlaceholder: 'Sizes, colours, finish, deadline...',
      },
      addItem: 'Add another product',
      removeItem: 'Remove product',
      design: {
        title: 'Your studio design',
        note: 'The preview you arranged is sent with this order. We will ask for the final artwork file when we call.',
        remove: 'Order without it',
      },
      submit: 'Place order',
      sending: 'Sending…',
      errors: {
        name: 'Please enter your name.',
        mobile: 'Please enter a valid mobile number.',
        items: 'Choose at least one product.',
        quantity: 'Each quantity needs to be a number above zero.',
        failed: 'That did not go through. Please try again, or call us and we will take the order.',
        unavailable: 'Online ordering is not open yet. Please use the contact page for now.',
      },
      done: {
        eyebrow: 'Order received',
        heading: 'Thank you.',
        number: 'Your order number',
        bodyBefore: 'We will call you on ',
        bodyAfter: ' to confirm the details and price.',
        another: 'Place another order',
        home: 'Back to the start',
      },
    },

    notFound: {
      title: 'Not found — INMORE',
      code: '404',
      heading: 'This page is not in the print run.',
      body: 'The link may be old, or the page may still be in production.',
      back: 'Back to the start',
    },

    error: {
      eyebrow: 'Something broke',
      heading: 'This part of the site did not load.',
    },
  },
};
