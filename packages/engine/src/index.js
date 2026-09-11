/**
 * The configurator engine.
 *
 * One component and the handful of values a host needs to build its props.
 * Everything tenant-specific arrives through `<Studio>`; nothing in this
 * package knows about any particular client.
 *
 * The rules this package keeps, which are the whole reason it is a package
 * rather than a directory:
 *
 * - No fetch to a hardcoded host. Callers supply `assetBase` and the catalogue.
 * - No global CSS, and no reliance on tokens defined outside its own root.
 * - No route awareness. It mounts into a div on a page it does not own.
 * - Every string comes from a locale bundle. No inline English.
 * - Two instances on one page do not interfere.
 */

export { Studio, default as default } from './Studio';

/* --- Building a catalogue ---------------------------------------------------- */
export { createCatalogue, paletteFor, localizeProduct } from './catalogue';

/* --- The styling boundary, for a host that wants to compose its own layout --- */
export { StudioRoot, studioUtils } from './StudioRoot';

/* --- Copy -------------------------------------------------------------------- */
export {
  ENGINE_LOCALES,
  DEFAULT_LOCALE,
  directionFor,
  isEngineLocale,
  localize,
  resolveCopy,
  useCopy,
  useStudioLocale,
} from './i18n';

/* --- Assets ------------------------------------------------------------------ */
export { resolveAsset, useAsset, useAssetBase } from './assets';

/* --- Licensing --------------------------------------------------------------- */
export { domainLicense, permissiveLicense, useLicense } from './license';

/* --- The submit payload, and the maths behind it ----------------------------- */
export { buildSubmitPayload, artworkRef, printSizeFor } from './artwork/submitPayload';
export {
  DEFAULT_PRINT_DPI,
  DEFAULT_RENDER_DPI,
  MAX_TEXTURE_EDGE,
  getArtworkBox,
  getBleedRect,
  getFitWidthMm,
  getPrintRect,
  getSafeRect,
  normaliseSafe,
  resolveSurface,
} from './artwork/composeArtwork';

/* --- Layout thresholds, for a host deciding how much room to give us --------- */
export { COMPACT_WIDTH, SIDE_PANEL_RATIO } from './utils/useElementShape';

/* --- Pieces, for a host composing its own arrangement ------------------------ */
export { default as Button } from './ui/Button';
export { default as Slider } from './ui/Slider';
export { SNAP_POINTS, SIDE_SNAP_POINTS } from './components/StudioSheet';
export { default as StudioProvider, useStudio } from './state/StudioProvider';
export { transformLimitsFor, createTransform } from './state/studioReducer';
export { default as ProductPicker } from './components/ProductPicker';
export { default as StockPicker } from './components/StockPicker';
export { default as ArtworkDropzone } from './components/ArtworkDropzone';
export { default as ArtworkControls } from './components/ArtworkControls';
export { default as FlatPreview } from './components/FlatPreview';
export { default as StudioStage } from './components/StudioStage';

/* --- The 3-D layer, for a host that wants a viewer without the controls ------ */
export { default as ProductViewer } from './three/ProductViewer';
export { default as ProductModel } from './three/ProductModel';
export { default as Stage } from './three/Stage';
export { default as resolveCamera } from './three/framing';
export { preloadProductModel } from './three/models/loader';
export { preloadGlbModels } from './three/models/preloadModels';
export { default as useModelAvailability } from './three/models/useModelAvailability';
