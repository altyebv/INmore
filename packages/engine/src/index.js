/**
 * The configurator engine.
 *
 * Empty on purpose. This package is scaffolded ahead of the code that will
 * live in it so that later phases move files into their final home once,
 * rather than into an interim one and then again.
 *
 * What lands here, and roughly when:
 *
 * - the artwork pipeline — upload, trim, composite  (`lib/artwork/`)
 * - the 3-D layer — viewer, stage, framing, print surface  (`three/`)
 * - the studio UI and its state machine  (`features/studio/`)
 * - the engine's own UI strings, one bundle per locale
 *
 * The public surface will be a single component with an explicit props
 * contract:
 *
 *   <Studio
 *     config={validatedTenantConfig}
 *     sku="paper-cup-8oz"
 *     locale="ar"
 *     assetBase="https://cdn.example.com/t/inmore/"
 *     license={licenseAdapter}
 *     onSubmit={(payload) => {}}
 *     onEvent={(name, data) => {}}
 *   />
 *
 * The rules this package has to keep, which are the whole reason it is a
 * package rather than a directory:
 *
 * - No fetch to a hardcoded host. Callers supply `assetBase` and `config`.
 * - No global CSS, and no reliance on tokens defined outside its own root.
 * - No route awareness. It mounts into a div on a page it does not own.
 * - Every string comes from a locale bundle. No inline English.
 * - Two instances on one page must not interfere.
 */

export {};
