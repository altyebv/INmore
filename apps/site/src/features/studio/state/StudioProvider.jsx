import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { loadArtwork, releaseArtwork, ArtworkError } from '@/lib/artwork/loadArtwork';
import autoTrim from '@/lib/artwork/autoTrim';
import { IDENTITY_CROP } from '@/lib/artwork/constants';
import { getFitWidthMm } from '@/lib/artwork/composeArtwork';
import { useT } from '@/i18n';
import studioReducer, { createInitialState, createTransform } from './studioReducer';

const StudioContext = createContext(null);

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
 * @param {{
 *   catalogue: import('@/products').Catalogue,
 *   initialProductId?: string,
 *   children: React.ReactNode,
 * }} props
 */
export function StudioProvider({ children, catalogue, initialProductId }) {
  const openOn = initialProductId ?? catalogue.defaultProductId;
  const initialProduct = catalogue.get(openOn) ?? catalogue.live[0];

  if (!initialProduct) {
    throw new Error('StudioProvider was given a catalogue with no live products.');
  }

  const [state, dispatch] = useReducer(studioReducer, initialProduct, createInitialState);
  const previousArtwork = useRef(null);
  const errorCopy = useT().studio.errors;

  const product = catalogue.get(state.productId) ?? initialProduct;

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
      });
    },
    [catalogue, placementFor, state.artwork]
  );

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
    [state, product, catalogue, errorCopy, uploadArtwork, clearArtwork, selectProduct]
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside a StudioProvider.');
  return context;
}

export default StudioProvider;
