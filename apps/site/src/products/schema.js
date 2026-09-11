/**
 * Product configuration contract.
 *
 * Kept as JSDoc typedefs rather than TypeScript so editors give us the same
 * autocompletion and shape-checking without adding a compile step.
 *
 * @typedef {Object} PrintUVRegion
 * @property {number} x       Left edge in UV space, 0–1.
 * @property {number} y       Top edge in UV space, 0–1.
 * @property {number} width   Width in UV space, 0–1.
 * @property {number} height  Height in UV space, 0–1.
 *
 * @typedef {Object} ArtworkTransform
 * @property {number} scale     Artwork width as a fraction of print-area width.
 * @property {number} x         Horizontal offset, -1…1 of the print area.
 * @property {number} y         Vertical offset, -1…1 of the print area.
 * @property {number} rotation  Degrees.
 * @property {number} repeat    Horizontal repeats across the wrap.
 *
 * @typedef {Object} ProductPrintConfig
 * @property {{ width: number, height: number }} texture
 * @property {PrintUVRegion} uv
 * @property {{ widthMm: number, heightMm: number, bleedMm: number, safeMm: number }} physical
 * @property {boolean} wrap
 * @property {string} stockColor
 * @property {ArtworkTransform} defaultTransform
 *
 * @typedef {Object} ProductModelConfig
 * @property {string} url             Path to the production GLB.
 * @property {string} printMeshName   Mesh inside the GLB carrying the print.
 * @property {string} proxy           Proxy geometry key used until the GLB exists.
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
 */

export {};
