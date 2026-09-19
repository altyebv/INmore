import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { loadArtwork, releaseArtwork, ArtworkError } from '../artwork/loadArtwork';
import autoTrim from '../artwork/autoTrim';
import { IDENTITY_CROP } from '../artwork/constants';
import { getFitWidthMm } from '../artwork/composeArtwork';
import {
  bestOn,
  createTextArtwork,
  defaultTextTransform,
  refitTransform,
  retuneWidth,
} from '../artwork/text';
import { ensureFont, isFontReady, useFontVersion } from '../artwork/fonts';
import { useAssetBase } from '../assets';
import { resolveTextSettings } from '../catalogue';
import { useCopy } from '../i18n';
import studioReducer, { createInitialState, createTransform } from './studioReducer';

const StudioContext = createContext(null);

/** For a catalogue built without a `text` block (a hand-rolled one, in a test). */
const DEFAULT_TEXT = resolveTextSettings();

/**
 * Owns all studio interaction state and the side effects around file loading.
 * Rendering components read from here; none of them touch the file system,
 * the compositor or the reducer directly.
 *
 * The catalogue arrives as a prop rather than being imported. Two providers on
 * one page then hold two independent studios over two different product sets,
 * which is the property the whole extraction rests on — and it is also what
 * makes the catalogue a thing the caller owns rather than a thing this module
 * decides.
 *
 * `sku` is controlled if the caller keeps supplying it: on mount it decides
 * which product opens, and changing it afterwards selects that product, the
 * same way clicking the picker would. A host that passes it once and forgets
 * gets the initial behaviour and nothing more.
 *
 * @param {{
 *   catalogue: import('../catalogue').Catalogue,
 *   sku?: string,
 *   initialProductId?: string,
 *   children: React.ReactNode,
 * }} props
 */
export function StudioProvider({ children, catalogue, sku, initialProductId }) {
  const openOn = sku ?? initialProductId ?? catalogue.defaultProductId;
  const initialProduct = catalogue.get(openOn) ?? catalogue.live[0];

  if (!initialProduct) {
    throw new Error('StudioProvider was given a catalogue with no live products.');
  }

  const [state, dispatch] = useReducer(studioReducer, initialProduct, createInitialState);
  const previousArtwork = useRef(null);
  const copy = useCopy();
  const errorCopy = copy.errors;
  const assetBase = useAssetBase();
  const fontVersion = useFontVersion();
  const nextTextId = useRef(0);

  const product = catalogue.get(state.productId) ?? initialProduct;

  const textSettings = catalogue.text ?? DEFAULT_TEXT;
  const canText = textSettings.enabled && product.print.text !== false;
  const fontFor = useCallback(
    (id) =>
      textSettings.fonts.find((font) => font.id === id) ??
      textSettings.fonts.find((font) => font.id === textSettings.defaultFont) ??
      textSettings.fonts[0],
    [textSettings]
  );

  /**
   * Size and place existing artwork for a product's print area.
   *
   * Shared by upload and by switching product, so a logo lands looking
   * deliberate in both cases rather than tiny on a large panel.
   */
  const placementFor = useCallback((nextProduct, art) => {
    const base = { ...createTransform(nextProduct), crop: art?.crop ?? IDENTITY_CROP };
    if (!art) return base;
    const fit = getFitWidthMm(nextProduct.print, art, base, 'contain');
    return { ...base, widthMm: Math.min(base.widthMm, fit * 0.82) };
  }, []);

  const selectProduct = useCallback(
    (next) => {
      const target = catalogue.get(next.id) ?? next;
      dispatch({
        type: 'select-product',
        product: target,
        transform: placementFor(target, state.artwork),
        texts: state.texts.map((layer) => ({
          ...layer,
          transform: refitTransform(layer.transform, product.print, target.print),
        })),
      });
    },
    [catalogue, placementFor, state.artwork, state.texts, product]
  );

  /*
   * Follow a caller that changes which product is shown.
   *
   * `sku` is a request, not a lock: it is acted on when it *changes*, never
   * merely because it differs from what is on screen. The first version
   * compared the two on every render, and since the embed always passes a
   * sku, each click in the picker was undone on the next render — the stock
   * reset to the original product's, which looked like the click had only
   * changed a colour — and after a host's `setSku()` the studio was pinned to
   * that product instead.
   *
   * Selecting routes through the same path as a click on the picker, so the
   * visitor's artwork carries over and is re-placed for the new print area. A
   * host that wants to send a visitor back to a product they have moved away
   * from keeps its copy in step (the studio reports `product:select`) and
   * changes it.
   */
  const requestedSku = useRef(sku);
  useEffect(() => {
    if (sku === requestedSku.current) return;
    requestedSku.current = sku;
    if (!sku || sku === state.productId) return;
    const target = catalogue.get(sku);
    if (target) selectProduct(target);
  }, [sku, state.productId, catalogue, selectProduct]);

  const uploadArtwork = useCallback(
    async (file) => {
      dispatch({ type: 'artwork-loading' });
      try {
        const artwork = await loadArtwork(file);

        // Remove exported padding, then size the mark so it reads immediately.
        artwork.crop = autoTrim(artwork.source, artwork.width, artwork.height);
        const transform = placementFor(product, artwork);

        if (previousArtwork.current) releaseArtwork(previousArtwork.current);
        previousArtwork.current = artwork;

        dispatch({ type: 'artwork-loaded', artwork, transform, product });
        return artwork;
      } catch (error) {
        // Store the code; the message is resolved below in the active language.
        dispatch({
          type: 'artwork-error',
          error: error instanceof ArtworkError ? error.code : 'unknown',
        });
        return null;
      }
    },
    [product, placementFor]
  );

  const clearArtwork = useCallback(() => {
    if (previousArtwork.current) releaseArtwork(previousArtwork.current);
    previousArtwork.current = null;
    dispatch({ type: 'artwork-cleared', product });
  }, [product]);

  /* --- Text ------------------------------------------------------------------ */

  // Text a product cannot take stays in state — switch back and it returns —
  // but takes no part in what is drawn or sent.
  const texts = useMemo(() => (canText ? state.texts : []), [canText, state.texts]);

  /*
   * Text layers as things the compositor can place. Rebuilt when a font
   * arrives (`fontVersion`), because a measurement taken in the fallback is
   * the wrong measurement.
   */
  const textArtworks = useMemo(
    () => texts.map((layer) => createTextArtwork(layer, fontFor(layer.fontId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texts, fontFor, fontVersion]
  );

  // The visitor's things in drawing order: the image below, text above it.
  const layers = useMemo(() => {
    const out = [];
    if (state.artwork) {
      out.push({ id: 'artwork', kind: 'image', artwork: state.artwork, transform: state.transform });
    }
    texts.forEach((layer, index) => {
      out.push({
        id: layer.id,
        kind: 'text',
        artwork: textArtworks[index],
        transform: layer.transform,
        text: layer,
        font: fontFor(layer.fontId),
      });
    });
    return out;
  }, [state.artwork, state.transform, texts, textArtworks, fontFor]);

  const selected = layers.find((layer) => layer.id === state.selectedId) ?? layers[layers.length - 1] ?? null;

  // The words changed, or the font: keep the letters the same size.
  const updateText = useCallback(
    (id, patch, commit = true) => {
      const layer = state.texts.find((entry) => entry.id === id);
      if (!layer) return;

      const clean = { ...patch };
      if (typeof clean.content === 'string') {
        clean.content = clean.content.slice(0, textSettings.maxLength);
      }

      let transform;
      if ('content' in clean || 'fontId' in clean) {
        const merged = { ...layer, ...clean };
        const font = fontFor(merged.fontId);
        ensureFont(font, assetBase);
        const { aspect } = createTextArtwork(merged, font);
        clean.aspect = aspect;
        transform = { widthMm: retuneWidth(layer.transform, layer.aspect, aspect, product.print) };
      }

      dispatch({ type: 'text-update', id, patch: clean, transform, commit, product });
    },
    [state.texts, textSettings.maxLength, fontFor, assetBase, product]
  );

  const addText = useCallback(
    (initial) => {
      // Called bare, and also as an onClick — an event is not the words.
      const content = typeof initial === 'string' ? initial : copy.text?.defaultContent ?? 'Your text';
      if (!canText || state.texts.length >= textSettings.maxLayers) return null;

      nextTextId.current += 1;
      const id = `text-${nextTextId.current}`;
      const font = fontFor(textSettings.defaultFont);
      ensureFont(font, assetBase);

      const layer = { id, content, fontId: font.id, color: bestOn(state.baseColor, textSettings.colors), align: 'center' };
      const { aspect } = createTextArtwork(layer, font);
      const existing = (state.artwork ? 1 : 0) + state.texts.length;

      dispatch({
        type: 'text-add',
        product,
        layer: { ...layer, aspect, transform: defaultTextTransform(product.print, aspect, existing) },
      });
      return id;
    },
    [canText, state.texts.length, state.artwork, state.baseColor, textSettings, fontFor, assetBase, product, copy.text]
  );

  const removeText = useCallback((id) => dispatch({ type: 'text-remove', id }), []);
  const selectLayer = useCallback((id) => dispatch({ type: 'select-layer', id }), []);

  /*
   * The placement controls act on whichever layer is selected, so the sliders,
   * the drag surface and the keyboard nudges are the same code for a logo and
   * for a line of text.
   */
  const setLayerTransform = useCallback(
    (patch, commit = true) => {
      if (!selected) return;
      if (selected.kind === 'text') {
        dispatch({ type: 'text-transform', id: selected.id, patch, commit, product });
      } else {
        dispatch({ type: 'transform', patch, commit, product });
      }
    },
    [selected, product]
  );

  const resetLayer = useCallback(() => {
    if (!selected) return;
    if (selected.kind === 'text') {
      dispatch({
        type: 'text-transform',
        id: selected.id,
        patch: defaultTextTransform(product.print, selected.text.aspect, Math.max(0, layers.indexOf(selected))),
        commit: true,
        product,
      });
    } else {
      dispatch({ type: 'reset-transform', product });
    }
  }, [selected, layers, product]);

  // A font that finishes loading changes a line's width. Keep the height.
  useEffect(() => {
    state.texts.forEach((layer) => {
      const font = fontFor(layer.fontId);
      if (!isFontReady(font, assetBase)) return;
      const { aspect } = createTextArtwork(layer, font);
      if (Math.abs(aspect / layer.aspect - 1) < 0.005) return;
      dispatch({
        type: 'text-remeasure',
        id: layer.id,
        aspect,
        widthMm: retuneWidth(layer.transform, layer.aspect, aspect, product.print),
        product,
      });
    });
  }, [fontVersion, state.texts, fontFor, assetBase, product]);

  const value = useMemo(
    () => ({
      ...state,
      error: state.error ? errorCopy[state.error] ?? errorCopy.unknown : null,
      product,
      // Passed down rather than imported, so a picker shows this studio's
      // products and not whatever some module decided were the products.
      catalogue,
      dispatch,
      uploadArtwork,
      clearArtwork,
      texts,
      layers,
      selected,
      selectedId: selected?.id ?? null,
      canText,
      textSettings,
      fontFor,
      addText,
      updateText,
      removeText,
      selectLayer,
      setLayerTransform,
      resetLayer,
      setTransform: (patch, commit = true) =>
        dispatch({ type: 'transform', patch, commit, product }),
      resetTransform: () => dispatch({ type: 'reset-transform', product }),
      selectProduct,
      setView: (view) => dispatch({ type: 'set-view', view }),
      setBaseColor: (color) => dispatch({ type: 'base-color', color }),
      toggleAutoRotate: (v) => dispatch({ type: 'toggle-auto-rotate', value: v }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      canUndo: state.history.length > 0,
      canRedo: state.future.length > 0,
    }),
    [
      state,
      product,
      catalogue,
      errorCopy,
      uploadArtwork,
      clearArtwork,
      selectProduct,
      texts,
      layers,
      selected,
      canText,
      textSettings,
      fontFor,
      addText,
      updateText,
      removeText,
      selectLayer,
      setLayerTransform,
      resetLayer,
    ]
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside a StudioProvider.');
  return context;
}

export default StudioProvider;
