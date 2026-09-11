/**
 * Product configuration contract.
 *
 * Kept as JSDoc typedefs rather than TypeScript so editors give us the same
 * autocompletion and shape-checking without adding a compile step.
 *
 * ## The units
 *
 * Everything about a print area is millimetres. Nothing declares pixels — the
 * texture's resolution is derived from the physical size, at one density on
 * both axes, so a config cannot describe a print area whose pixels disagree
 * with its physical shape. It used to be able to, and on three of four
 * products it did.
 *
 * The one exception is `defaultTransform`, which is in fractions of the print
 * area. That is deliberate: how large a mark should land relative to the
 * surface is a product's own opinion and stays true whatever its real size,
 * whereas "96 mm" would have to be rewritten if the product changed size.
 *
 * @typedef {Object} PrintUVRegion
 * @property {number} x       Left edge in UV space, 0–1.
 * @property {number} y       Top edge in UV space, 0–1.
 * @property {number} width   Width in UV space, 0–1.
 * @property {number} height  Height in UV space, 0–1.
 *
 * @typedef {Object} SafeMargins
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 * @property {number} left
 *
 * @typedef {Object} PhysicalArea
 * @property {number} widthMm   Finished width of the flat print area.
 * @property {number} heightMm  Finished height of the same.
 * @property {number} bleedMm   How far artwork must run past the trim line.
 * @property {number|SafeMargins} safeMm  Inset that is guaranteed to print. One
 *   number means the same margin on every edge; per-edge is what a real dieline
 *   usually needs, since a cup's rim curl is not its base.
 *
 * @typedef {Object} DefaultPlacement
 * @property {number} width     Artwork width, as a fraction of the print area's width.
 * @property {number} x         Horizontal offset, -1…1 of half the print area.
 * @property {number} y         Vertical offset, -1…1 of half the print area.
 * @property {number} rotation  Degrees.
 * @property {number} repeat    Horizontal repeats across the wrap.
 *
 * @typedef {Object} ArtworkTransform
 * @property {number} widthMm   Artwork width on the finished product.
 * @property {number} xMm       Centre offset from the print area's centre, positive right.
 * @property {number} yMm       Centre offset from the print area's centre, positive down.
 * @property {number} rotation  Degrees, clockwise.
 * @property {number} repeat    Evenly spaced copies across the print area.
 * @property {{x:number,y:number,width:number,height:number}} crop Normalised source crop.
 *
 * @typedef {Object} DecalProjection
 * @property {string} axis        Which way the printed panel faces, e.g. 'z', '-y'.
 * @property {string} up          Which way is up on that panel.
 * @property {number} threshold   How square-on a triangle must be to count.
 * @property {number} inset       Fraction held back from the folded edges.
 * @property {number} liftMm      How far the decal floats off the surface.
 *
 * @typedef {Object} ProductPrintConfig
 * @property {'texture'|'decal'} mode  Whether the mesh's authored UVs are a
 *   print layout, or a print surface has to be built by projection.
 * @property {PrintUVRegion} [uv]      Where the print area sits in UV space.
 *   Defaults to the whole of it.
 * @property {PhysicalArea} physical
 * @property {number} [renderDpi]      Screen resolution. Capped by texture budget.
 * @property {number} [printDpi]       Press resolution. Never capped.
 * @property {DecalProjection} [projection]  Required when mode is 'decal'.
 * @property {boolean} wrap            Left and right edges meet at a seam.
 * @property {string} stock            Default stock id.
 * @property {string[]} [stockPalette] Stock ids this product is available in.
 * @property {string} stockColor       Resolved by the catalogue from `stock`.
 * @property {DefaultPlacement} defaultTransform
 *
 * @typedef {Object} ProductModelConfig
 * @property {string} url             Path to the production GLB.
 * @property {string} printMeshName   Mesh inside the GLB carrying the print.
 * @property {string[]} [stockMeshes] Meshes that take the stock colour.
 * @property {string[]} [hiddenMeshes] Finishing options, hidden unless asked for.
 * @property {string} [proxy]         Proxy geometry key used until the GLB exists.
 * @property {number} scale
 * @property {number} yOffset
 * @property {number} heightM
 *
 * @typedef {Object} ProductConfig
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} shortName
 * @property {string} category
 * @property {'live'|'coming-soon'} status
 * @property {number} order
 * @property {string} summary
 * @property {{ label: string, value: string }[]} specs
 * @property {ProductModelConfig} model
 * @property {Object} camera
 * @property {ProductPrintConfig} print
 * @property {Object} material
 * @property {string[]} guidance
 * @property {Record<string, Object>} [translations]
 */

export {};
