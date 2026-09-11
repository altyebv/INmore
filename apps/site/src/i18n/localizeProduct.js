import { useMemo } from 'react';
import { useLocale } from './LocaleProvider';

/**
 * Resolve a product's display strings for the active locale.
 *
 * Product configs stay single objects — geometry, print area, camera and
 * translations together — because they describe one physical thing. Only the
 * readable fields are swapped, and a product with no translation for a
 * language simply keeps its base strings rather than disappearing.
 */
export function localizeProduct(product, locale) {
  const translation = product?.translations?.[locale];
  if (!translation) return product;
  return { ...product, ...translation };
}

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
