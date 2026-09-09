import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { getProduct, defaultProductId } from '@/products';
import { loadArtwork, releaseArtwork, ArtworkError } from '@/lib/artwork/loadArtwork';
import autoTrim from '@/lib/artwork/autoTrim';
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

  const uploadArtwork = useCallback(
    async (file) => {
      dispatch({ type: 'artwork-loading' });
      try {
        const artwork = await loadArtwork(file);

        // Remove exported padding, then size the mark so it reads immediately.
        artwork.crop = autoTrim(artwork.source, artwork.width, artwork.height);

        const base = { ...createTransform(product), crop: artwork.crop };
        const fit = getFitScale(product.print, artwork, base, 'contain');
        const transform = { ...base, scale: Math.min(base.scale, fit * 0.82) };

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
    [product]
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
      selectProduct: (next) => dispatch({ type: 'select-product', product: next }),
      setView: (view) => dispatch({ type: 'set-view', view }),
      setBaseColor: (color) => dispatch({ type: 'set-base-color', color }),
      toggleAutoRotate: (v) => dispatch({ type: 'toggle-auto-rotate', value: v }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      canUndo: state.history.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state, product, errorCopy, uploadArtwork, clearArtwork]
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside a StudioProvider.');
  return context;
}

export default StudioProvider;
