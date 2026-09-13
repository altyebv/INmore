/**
 * The studio's own strings, in English.
 *
 * These belong to the engine, not to any client: they name controls and
 * explain interactions, and every tenant gets the same ones. A client's own
 * words — product names, specs, guidance, board names — live in their config
 * and arrive as data.
 *
 * The shape of this module is the contract every locale implements. A missing
 * translation should be a visible shape mismatch, not an English string
 * quietly appearing in an Arabic studio.
 */

export default {
  panelLabel: 'Product configuration',
  sections: {
    stock: 'Stock',
    artwork: 'Your artwork',
    placement: 'Placement',
    details: 'Details',
  },
  /** Short names for the touch layout's rail, where each sits under an icon. */
  rail: { stock: 'Colour', artwork: 'Logo', placement: 'Place', details: 'Info' },
  drawer: {
    label: 'Studio controls',
    show: 'Show controls',
    hide: 'Hide controls',
    close: 'Close panel',
  },
  stock: {
    label: 'Stock',
    custom: 'Custom colour',
  },
  chooseProduct: 'Choose a product',
  comingSoon: 'Soon',
  modelInPreparation: 'Model in preparation',
  downloadProof: 'Download proof',
  referenceGeometry: 'Reference geometry — replaced by the approved production model on arrival.',
  orbitHint: 'Drag to rotate · scroll to zoom',
  orbitHintTouch: 'Drag to rotate · pinch to zoom',
  undo: 'Undo',
  redo: 'Redo',
  placementEmpty: 'Add your artwork to position it on the product.',
  specs: 'Specifications',
  guidance: 'Print guidance',
  dropzone: {
    title: 'Drop your logo here',
    titleTouch: 'Add your logo',
    hint: 'PNG · JPG · WEBP · SVG · up to 25 MB',
    reading: 'Reading your file…',
    upload: 'Upload your logo or artwork',
    replace: 'Replace',
    remove: 'Remove',
    removeLabel: 'Remove artwork',
  },
  preview: {
    emptyLabel: 'Print area · unprinted stock',
    seam: 'seam',
    safeArea: 'safe area',
    lowForPrint: 'low for print',
    dragLabel: 'Print area. Drag to position your artwork, or use the arrow keys.',
    emptyAria: 'Print area, currently empty.',
  },
  controls: {
    size: 'Size',
    across: 'Across',
    upDown: 'Up / down',
    turn: 'Turn',
    repeat: 'Repeat around',
    once: 'once',
    fitHeight: 'Fit height',
    centre: 'Centre',
    crop: 'Crop',
    doneCropping: 'Done cropping',
    reset: 'Reset',
  },
  crop: {
    area: 'Crop area',
    trim: 'Trim edges',
    whole: 'Use whole image',
    note: 'Drag inside to move · drag a corner to resize',
    noteTouch: 'Drag inside to move · drag a corner to resize',
  },
  errors: {
    type: 'That file type is not supported. Use a PNG, JPG, WEBP or SVG.',
    size: 'That file is larger than 25 MB. Export a smaller version and try again.',
    decode: 'We could not read that image. It may be corrupted or use an unusual encoding.',
    empty: 'No file was received.',
    unknown: 'Something went wrong reading that file.',
  },
};
