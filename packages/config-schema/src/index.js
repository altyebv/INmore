/**
 * The tenant configuration contract.
 *
 * Empty on purpose — scaffolded ahead of its contents so later phases move
 * code into its final home once. See `packages/engine/src/index.js` for the
 * same note.
 *
 * What lands here:
 *
 * - JSDoc typedefs describing a tenant config, so editors can check the shape
 *   without adding a compile step. We are staying in JavaScript.
 * - `validateTenantConfig(config)` — a real runtime validator returning
 *   structured errors that name their path, e.g.
 *   `products[2].decorationZones[0].physical.widthMm: expected number, got "180"`.
 *   A bad config must fail loudly at load with a readable message, never as a
 *   black screen.
 * - Defaults, so a config can stay small and still produce a working studio.
 *
 * The shape is deliberately not written down yet. It is settled by the
 * millimetre-space refactor that precedes this package: placement moves from
 * texture pixels into physical millimetres, which changes what a decoration
 * zone has to declare. Authoring the schema first would mean authoring it
 * twice.
 */

export {};
