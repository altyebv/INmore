import { resolveSurface } from './composeArtwork';
import { IDENTITY_CROP } from './constants';

/**
 * What leaves the studio when a visitor is finished.
 *
 * There is no backend yet, and this is defined anyway, because it is the
 * contract every future feature hangs off — a quote, a saved configuration, an
 * order, a print job. Defining it late would mean defining it around whatever
 * those features happened to need first.
 *
 * ## Why the transform is in millimetres
 *
 * The eventual print render is not a 3-D render. The plan is to composite the
 * uploaded artwork onto the flat 2-D dieline at 300 dpi with `sharp`, on a
 * server, with no Three.js and no browser. That job can only be a pure 2-D
 * composite if the placement it receives already means something outside this
 * application — and a number that says "0.42 of the print area's width in
 * texture pixels" does not. It needs the texture's dimensions, the UV window,
 * and the assumption that both were declared consistently with the product's
 * real size, which for most of this project's life they were not.
 *
 * `{ widthMm: 105, xMm: -12, yMm: 4, rotation: 0 }` needs none of that. It
 * says the same thing to `sharp` at 300 dpi as it does to a canvas at 200,
 * and the only thing the server has to know is how many pixels are in a
 * millimetre at its own resolution.
 *
 * ## Where the print render attaches
 *
 * `decorations[].placement` below is the whole input to that job, alongside
 * the artwork file itself. Given a dieline and a dpi:
 *
 *     pxPerMm      = dpi / 25.4
 *     artwork.width  = placement.widthMm * pxPerMm
 *     artwork.centre = dieline print-area centre + (xMm, yMm) * pxPerMm
 *     rotate about that centre by placement.rotation
 *     repeat across the print area width, if placement.repeat > 1
 *
 * which is `composeArtwork` with a different drawing surface, and nothing else.
 *
 * @typedef {Object} SubmitPayload
 * @property {string} tenant
 * @property {string} sku
 * @property {string} locale
 * @property {Record<string, string>} materials  Mesh role to chosen colour.
 * @property {Decoration[]} decorations
 * @property {Record<string, unknown>} options
 * @property {{ thumbnail: string|null }} previews
 *
 * @typedef {Object} Decoration
 * @property {string} zoneId
 * @property {string|null} assetHash  Identifies the artwork to whatever stores it.
 * @property {Placement} placement
 * @property {{ widthMm: number, heightMm: number, bleedMm: number, safeMm: object }} area
 *
 * @typedef {Object} Placement
 * @property {number} widthMm    Artwork width on the product.
 * @property {number} xMm        Centre offset from the print area's centre, positive right.
 * @property {number} yMm        Centre offset from the print area's centre, positive down.
 * @property {number} rotation   Degrees, clockwise.
 * @property {number} repeat     Evenly spaced copies across the print area.
 * @property {{x:number,y:number,width:number,height:number}} crop  Normalised source crop.
 */

/**
 * A stable identifier for an uploaded file.
 *
 * Deliberately not a content hash: hashing megabytes on the main thread to
 * fill in a field nothing yet reads would be a real cost for an imagined
 * benefit. Name, size and type identify a file well enough to correlate a
 * payload with an upload, and the real hash belongs wherever the file is
 * eventually stored — which is the only place that can verify it anyway.
 */
export function artworkRef(artwork) {
  if (!artwork) return null;
  return `${artwork.name}:${artwork.size}:${artwork.type}`;
}

/**
 * Build the payload for a finished configuration.
 *
 * @param {{
 *   tenant: string,
 *   locale: string,
 *   product: any,
 *   artwork: any,
 *   transform: any,
 *   baseColor: string,
 *   options?: Record<string, unknown>,
 *   thumbnail?: string|null,
 * }} input
 * @returns {SubmitPayload}
 */
export function buildSubmitPayload({
  tenant,
  locale,
  product,
  artwork,
  transform,
  baseColor,
  options = {},
  thumbnail = null,
}) {
  const { print } = product;
  const { physical } = print;

  const decorations = artwork
    ? [
        {
          // One zone per product today. The array is the shape a second one
          // would arrive in without this contract changing.
          zoneId: print.zoneId ?? 'primary',
          assetHash: artworkRef(artwork),
          placement: {
            widthMm: transform.widthMm,
            xMm: transform.xMm,
            yMm: transform.yMm,
            rotation: transform.rotation ?? 0,
            repeat: transform.repeat ?? 1,
            crop: transform.crop ?? IDENTITY_CROP,
          },
          // Restated so the payload is self-describing: a consumer can place
          // the artwork without also holding the tenant config.
          area: {
            widthMm: physical.widthMm,
            heightMm: physical.heightMm,
            bleedMm: physical.bleedMm ?? 0,
            safeMm: physical.safeMm,
            wrap: Boolean(print.wrap),
          },
        },
      ]
    : [];

  return {
    tenant,
    sku: product.id,
    locale,
    materials: { [print.stockMeshRole ?? 'body']: baseColor ?? print.stockColor },
    decorations,
    options,
    previews: { thumbnail },
  };
}

/**
 * The resolution a payload would be rendered at, for a given dpi.
 *
 * Exported mostly so a caller can show it — "your artwork will print at
 * 1240 × 1240 px" is a more useful answer than "300 dpi", and it is the same
 * arithmetic the server will do.
 */
export function printSizeFor(print, dpi) {
  const { texture } = resolveSurface(print, { dpi });
  return texture;
}

export default buildSubmitPayload;
