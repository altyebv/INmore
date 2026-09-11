import { useMemo } from 'react';
import { localizeProduct } from '@inmore/engine';
import { useLocale } from './LocaleProvider';

/**
 * Localising products, bound to the site's active locale.
 *
 * `localizeProduct` itself belongs to the engine — swapping a product's
 * readable fields is part of understanding a product config, and the engine is
 * what understands those. These are the site's convenience wrappers around it,
 * which is all the site actually needed: the same function, with the locale
 * already answered.
 */

export { localizeProduct };

export function useLocalizedProduct(product) {
  const { locale } = useLocale();
  return useMemo(() => localizeProduct(product, locale), [product, locale]);
}

/**
 * Localise a list of products.
 *
 * Takes the products rather than reaching for a module-level catalogue: which
 * products exist is the caller's business, and two callers on one page may
 * legitimately disagree about the answer.
 *
 * @param {any[]} products
 */
export function useLocalizedCatalogue(products) {
  const { locale } = useLocale();
  return useMemo(
    () => (products ?? []).map((p) => localizeProduct(p, locale)),
    [products, locale]
  );
}

export default localizeProduct;
