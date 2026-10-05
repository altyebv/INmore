/**
 * English content.
 *
 * The shape of this module is the contract every locale implements. Structural
 * data that must not drift between languages — ids, order, hrefs, routes —
 * stays identical; only human-readable strings change.
 */

const email = 'hello@inmore.store';
const phones = ['+974 5199 9340', '+974 5199 9273'];
const whatsapp = 'https://wa.me/97451999340';
const instagram = 'https://www.instagram.com/inmore.qa/';
const mapUrl = 'https://share.google/NkcF8REdggsFl5qWX';

export default {
  company: {
    name: 'INMORE',
    legalName: 'INMORE Advertising',
    location: 'Ezdan Mall, Al Gharrafa, Doha',
    statement: 'We build brands people can hold in their hands and find on their screens.',
    email,
    phones,
    whatsapp,
    instagram,
    address: ['First Floor, Gate 3, Ezdan Mall', 'Al Gharrafa, Doha', 'State of Qatar'],
    mapUrl,
    hours: 'Saturday to Thursday, 10 am – 10 pm. Closed on Friday.',
  },

  nav: [
    { to: '/studio', label: 'Studio' },
    { to: '/work', label: 'Work' },
    { to: '/capabilities', label: 'Print' },
    { to: '/digital', label: 'Digital' },
    { to: '/order', label: 'Order' },
    { to: '/contact', label: 'Contact' },
  ],

  footerColumns: [
    {
      title: 'Site',
      items: [
        { to: '/studio', label: 'Preview your product' },
        { to: '/work', label: 'Work' },
        { to: '/capabilities', label: 'Print & production' },
        { to: '/digital', label: 'Digital services' },
        { to: '/order', label: 'Place an order' },
        { to: '/contact', label: 'Start a project' },
      ],
    },
    {
      title: 'Contact',
      items: [
        { href: `mailto:${email}`, label: email },
        ...phones.map((number) => ({ href: `tel:${number.replace(/\s/g, '')}`, label: number })),
        { href: whatsapp, label: 'WhatsApp' },
        { href: instagram, label: 'Instagram' },
      ],
    },
  ],

  /*
   * The two halves of the house. Print is where a brand is held; digital is
   * where it is found. Everything else on the site hangs off one or the other.
   */
  practices: [
    {
      id: 'print',
      plates: 'cmyk',
      label: 'Print & production',
      title: 'Made to be held.',
      body: 'Packaging, stationery, apparel and giveaways, designed around the real material and produced to a proof you approve.',
      items: [
        'Brand identity and packaging design',
        'Offset, digital and screen printing',
        'Foil, emboss, lamination and finishing',
        'Samples, quality control and delivery',
      ],
      to: '/capabilities',
      cta: 'See print capabilities',
    },
    {
      id: 'digital',
      plates: 'rgb',
      label: 'Digital',
      title: 'Made to be found.',
      body: 'The accounts, campaigns, websites and apps that carry the same brand onto the screen, set up properly and looked after.',
      items: [
        'Social accounts, secured and managed',
        'Digital advertising',
        'Websites, e-stores and mobile apps',
        'SEO and digital presence',
      ],
      to: '/digital',
      cta: 'See digital services',
    },
  ],

  digitalServices: [
    {
      id: 'social-setup',
      index: '01',
      title: 'Social accounts, opened and secured',
      summary:
        'We register your accounts under the right names and lock them down, so the brand owns its handles from day one.',
      detail: ['Name and handle registration', 'Business account setup', 'Two-step security and recovery', 'Ownership stays with you'],
    },
    {
      id: 'social-management',
      index: '02',
      title: 'Accounts in one place, properly run',
      summary:
        'Every account brought under one roof, with a content plan, a consistent look and someone answering.',
      detail: ['Centralised access and roles', 'Content calendar', 'Post design and copy', 'Replies and community care'],
    },
    {
      id: 'advertising',
      index: '03',
      title: 'Digital advertising',
      summary:
        'Search and social campaigns built around one clear goal, with the spend and the results reported plainly.',
      detail: ['Search and social campaigns', 'Audience and keyword planning', 'Ad creative in Arabic and English', 'Monthly reporting'],
    },
    {
      id: 'presence',
      index: '04',
      title: 'Digital presence',
      summary:
        'Your business looking the same, and correct, everywhere people look it up: maps, profiles, listings and links.',
      detail: ['Google Business Profile', 'Listings and directories', 'Consistent name, address and hours', 'Reviews and reputation'],
    },
    {
      id: 'web',
      index: '05',
      title: 'Websites and e-stores',
      summary:
        'Fast, bilingual websites and online stores, designed to match the brand and built to be found.',
      detail: ['Company and campaign websites', 'Online stores and checkout', 'Arabic and English, right-to-left done properly', 'Domains, hosting and care'],
    },
    {
      id: 'apps',
      index: '06',
      title: 'Mobile applications',
      summary:
        'Apps for iPhone and Android when a website is not enough: ordering, loyalty, booking and internal tools.',
      detail: ['iOS and Android', 'Design and prototyping', 'Store publishing', 'Updates and support'],
    },
    {
      id: 'seo',
      index: '07',
      title: 'Search engine optimisation',
      summary:
        'The technical and content work that helps the right searches reach you, in Arabic and in English.',
      detail: ['Technical site audit', 'Arabic and English keywords', 'Structured data and local search', 'Ranking reports'],
    },
  ],

  digitalProcess: [
    { step: '01', title: 'Audit', body: 'We look at what exists today: accounts, website, listings and what a search for your name shows.' },
    { step: '02', title: 'Plan', body: 'A short plan with priorities, owners and a monthly budget, agreed before any work starts.' },
    { step: '03', title: 'Build', body: 'Accounts are secured, the site or app is designed and built, campaigns are prepared.' },
    { step: '04', title: 'Launch', body: 'You approve a preview first. Then it goes live, checked on real devices in both languages.' },
    { step: '05', title: 'Grow', body: 'Each month we report what happened in plain numbers and adjust what is not working.' },
  ],

  /* The same brand decision, once on paper and once on a screen. */
  surfaces: [
    { print: 'The logo on the box', digital: 'The profile picture on every account' },
    { print: 'The colours held on press', digital: 'The same colours in every post and page' },
    { print: 'The QR code on the bag', digital: 'The page it opens, and what happens next' },
    { print: 'The sign above the shop', digital: 'The pin, hours and reviews on the map' },
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
      digitalServices: 'Digital services',
      startDigital: 'Start a digital project',
      whatsapp: 'WhatsApp us',
      skipToContent: 'Skip to content',
      home: 'INMORE — home',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      language: 'Language',
      switchLanguage: 'العربية',
      reload: 'Reload',
    },

    home: {
      title: 'INMORE — Branding, print and digital marketing in Doha',
      description:
        'INMORE is a branding house at Ezdan Mall, Al Gharrafa, Doha: printed packaging and products, plus social media, websites, apps, ads and SEO for businesses in Qatar.',
      eyebrow: 'Branding · Print · Digital',
      headlineLead: 'Your brand,',
      headlineEmphasis: 'in hand and on screen.',
      lede:
        'We design and print the things people carry, and build the accounts, websites and campaigns they find you through.',
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
      practicesEyebrow: 'What we do',
      practicesTitle: 'One brand, in two places.',
      practicesLede:
        'People meet a brand in their hands and on their screens. We design and make both from the same identity, so they match.',
      digitalEyebrow: 'Digital',
      digitalTitle: 'The same brand, built for the screen.',
      digitalLede:
        'Our digital division works the way the print floor does: a clear scope, a preview you approve before launch, and one team answerable for the result.',
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
        'A selection of recent production across packaging, events, hospitality and retail. Full case studies are added as each client approves them, and digital projects will join them as they go live.',
      noteTitle: 'Want to see your brand on one of these?',
      noteBody:
        'The studio lets you place your logo on a real product and bring the preview into an order or conversation.',
    },

    capabilities: {
      title: 'Print and production — INMORE',
      description:
        'Print methods, finishes, substrates and formats produced in-house by INMORE in Doha, Qatar.',
      eyebrow: 'Print & production',
      heading: 'Everything between the idea and the delivery.',
      lede:
        'Design and production sit close together, so colour, material, finish and deadline are considered from the start.',
      specEyebrow: 'Specification',
      specTitle: 'What we produce.',
      processEyebrow: 'Process',
      processTitle: 'Five stages, clearly handled.',
      cta: 'Preview a product',
      digitalCta: 'See digital services',
    },

    digital: {
      title: 'Digital marketing, websites and apps in Doha — INMORE',
      description:
        'Social media setup and management, digital advertising, websites, e-stores, mobile apps and SEO for businesses in Qatar, from INMORE at Ezdan Mall, Doha.',
      eyebrow: 'Digital',
      heading: 'Made to be found.',
      lede:
        'Accounts, advertising, websites and apps that carry your brand onto the screen: set up properly, kept consistent and looked after by one team in Doha.',
      servicesEyebrow: 'Services',
      servicesTitle: 'Seven things we take off your desk.',
      ctaTitle: 'Not sure where to start?',
      ctaBody: 'Tell us where the brand is today. We will say what we would do first, and what can wait.',
      surfacesEyebrow: 'One brand, two surfaces',
      surfacesTitle: 'What we print and what we publish come from the same file.',
      surfacesLede:
        'Design, print and digital sit together here, so the colours, type and tone your customer holds are the ones they scroll past.',
      printLabel: 'In print',
      digitalLabel: 'On screen',
      processEyebrow: 'Process',
      processTitle: 'From a first look to a monthly report.',
    },

    contact: {
      title: 'Contact — INMORE',
      description:
        'Visit INMORE at Ezdan Mall, Al Gharrafa, Doha, or start a project online — branding, print production and digital services in Qatar.',
      eyebrow: 'Contact',
      heading: 'Tell us what you need.',
      lede:
        'For print, the product, quantity and deadline are enough to start. For digital, tell us where the brand is today and where you want it to be.',
      emailLabel: 'Email',
      phoneLabel: 'Telephone',
      studioLabel: 'Studio',
      hoursLabel: 'Hours',
      mapLabel: 'Open in Google Maps',
      fields: {
        name: 'Name',
        company: 'Company',
        email: 'Email',
        product: 'Product or service',
        groupPrint: 'Print',
        groupDigital: 'Digital',
        quantity: 'Quantity (print)',
        message: 'Tell us about the project',
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
