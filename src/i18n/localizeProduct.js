import { useMemo } from 'react';
import { catalogue as rawCatalogue } from '@/products';
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

export function useLocalizedCatalogue() {
  const { locale } = useLocale();
  return useMemo(() => rawCatalogue.map((p) => localizeProduct(p, locale)), [locale]);
}

export default localizeProduct;
