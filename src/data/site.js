/**
 * Company-level content.
 *
 * Everything here is copy the client will review. Keeping it in one module
 * means an approved rewrite is a single edit rather than a hunt through
 * components — and it is the natural seam to swap for a CMS later.
 */

export const COMPANY = {
  name: 'INMORE',
  legalName: 'INMORE Advertising',
  location: 'Doha, Qatar',
  statement: 'We make design something you can hold.',
  email: 'hello@inmore.qa',
  phone: '+974 0000 0000',
  address: ['Doha', 'State of Qatar'],
};

export const NAVIGATION = [
  { to: '/studio', label: 'Studio' },
  { to: '/work', label: 'Work' },
  { to: '/capabilities', label: 'Capabilities' },
  { to: '/contact', label: 'Contact' },
];

export const FOOTER_COLUMNS = [
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
      { href: `mailto:${COMPANY.email}`, label: COMPANY.email },
      { href: `tel:${COMPANY.phone.replace(/\s/g, '')}`, label: COMPANY.phone },
    ],
  },
];

/**
 * The four things the company actually sells, in the order a client meets them.
 */
export const DISCIPLINES = [
  {
    id: 'brand',
    index: '01',
    title: 'Brand',
    summary:
      'Identity systems built to survive contact with the real world — ink, substrate, tolerance and all.',
    detail: [
      'Naming and positioning',
      'Identity and logo systems',
      'Brand guidelines',
      'Art direction',
    ],
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
];

/**
 * Process steps. Written to describe how a job actually moves through the
 * building rather than as generic agency language.
 */
export const PROCESS = [
  { step: '01', title: 'Brief', body: 'Quantity, substrate, finish, deadline. What it has to survive.' },
  { step: '02', title: 'Artwork', body: 'Design or adaptation, laid out on the dieline that will be cut.' },
  { step: '03', title: 'Proof', body: 'A physical sample in your hands before the run is committed.' },
  { step: '04', title: 'Press', body: 'The run, monitored sheet by sheet against the approved proof.' },
  { step: '05', title: 'Finish', body: 'Cutting, forming, lamination, packing and delivery.' },
];

/**
 * Work entries. Deliberately structured rather than filled with stock imagery:
 * each becomes a real case study once photography and client approvals land.
 */
export const WORK = [
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
];

export const CAPABILITY_SPECS = [
  { label: 'Print methods', value: 'Offset, digital, screen, pad' },
  { label: 'Finishes', value: 'Matte and gloss lamination, soft touch, spot UV, foil, emboss' },
  { label: 'Substrates', value: 'Board, kraft, art paper, corrugate, food-grade stock' },
  { label: 'Formats', value: 'Cups, bags, boxes, sleeves, wraps, labels, signage' },
  { label: 'Minimum runs', value: 'From 1,000 units depending on format' },
  { label: 'Lead time', value: 'Typically 10–15 working days after proof approval' },
];
