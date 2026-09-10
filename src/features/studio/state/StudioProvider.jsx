import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { getProduct, defaultProductId } from '@/products';
import { loadArtwork, releaseArtwork, ArtworkError } from '@/lib/artwork/loadArtwork';
import autoTrim from '@/lib/artwork/autoTrim';
import { IDENTITY_CROP } from '@/lib/artwork/constants';
import { getFitScale } from '@/lib/artwork/composeArtwork';
import { useT } from '@/i18n';
import studioReducer, { createInitialState, createTransform } from './studioReducer';

const StudioContext = createContext(null);

/**
 * Owns all studio interaction state and the side effects around file loading.
 * Rendering components read from here; none of them touch the file system,
 * the compositor or the reducer directly.
 */
export function StudioProvider({ children, initialProductId = defaultProductId }) {
  const initialProduct = getProduct(initialProductId) ?? getProduct(defaultProductId);
  const [state, dispatch] = useReducer(studioReducer, initialProduct, createInitialState);
  const previousArtwork = useRef(null);
  const errorCopy = useT().studio.errors;

  const product = getProduct(state.productId) ?? initialProduct;

  /**
   * Size and place existing artwork for a product's print area.
   *
   * Shared by upload and by switching product, so a logo lands looking
   * deliberate in both cases rather than tiny on a large panel.
   */
  const placementFor = useCallback((nextProduct, art) => {
    const base = { ...createTransform(nextProduct), crop: art?.crop ?? IDENTITY_CROP };
    if (!art) return base;
    const fit = getFitScale(nextProduct.print, art, base, 'contain');
    return { ...base, scale: Math.min(base.scale, fit * 0.82) };
  }, []);

  const selectProduct = useCallback(
    (next) => {
      const target = getProduct(next.id) ?? next;
      dispatch({
        type: 'select-product',
        product: target,
        transform: placementFor(target, state.artwork),
      });
    },
    [placementFor, state.artwork]
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

        dispatch({ type: 'artwork-loaded', artwork, transform });
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
      dispatch,
      uploadArtwork,
      clearArtwork,
      setTransform: (patch, commit = true) => dispatch({ type: 'transform', patch, commit }),
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
    [state, product, errorCopy, uploadArtwork, clearArtwork, selectProduct]
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside a StudioProvider.');
  return context;
}

export default StudioProvider;
