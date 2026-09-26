import { useMemo } from 'react';
import { useLocale } from './LocaleProvider';

/**
 * Localising products for the active locale.
 *
 * Swaps a product's readable fields (`name`, `shortName`, `category`) for the
 * visitor's language, falling back to English. Everything else passes through.
 */
const READABLE = ['name', 'shortName', 'category'];

export function localizeProduct(product, locale) {
  const out = { ...product };
  for (const key of READABLE) {
    const value = product[key];
    if (value && typeof value === 'object') out[key] = value[locale] ?? value.en;
  }
  return out;
}

export function useLocalizedProduct(product) {
  const { locale } = useLocale();
  return useMemo(() => localizeProduct(product, locale), [product, locale]);
}

/** @param {any[]} products */
export function useLocalizedCatalogue(products) {
  const { locale } = useLocale();
  return useMemo(
    () => (products ?? []).map((p) => localizeProduct(p, locale)),
    [products, locale]
  );
}

export default localizeProduct;
