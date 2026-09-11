import { createContext, useContext } from 'react';
import en from './en';
import ar from './ar';

/**
 * The studio's own copy.
 *
 * Deliberately small and deliberately not a translation framework. The engine
 * needs a few dozen strings in whatever language it has been asked for, and
 * every consumer already passes `locale` as a prop — so this is a lookup and a
 * context, not a runtime with key parsing and interpolation.
 *
 * A client's own words do not come through here. Product names, specs,
 * guidance and board names are tenant data: they arrive in the config, already
 * carrying their own translations, because they are the one part of the studio
 * that differs between clients.
 */

export const BUNDLES = { en, ar };

export const ENGINE_LOCALES = Object.keys(BUNDLES);

export const DEFAULT_LOCALE = 'en';

/** Languages that read right to left. */
const RTL = new Set(['ar', 'he', 'fa', 'ur']);

export function directionFor(locale) {
  return RTL.has(locale) ? 'rtl' : 'ltr';
}

export function isEngineLocale(locale) {
  return Object.prototype.hasOwnProperty.call(BUNDLES, locale);
}

/**
 * Resolve a locale to its bundle.
 *
 * A host may legitimately ask for a language the engine has not been
 * translated into — the tenant's own product copy might exist in it even when
 * the engine's controls do not. English is the fallback, and `copy` lets a
 * host override individual strings (or supply a whole language) without the
 * engine shipping a translation for it.
 */
export function resolveCopy(locale, overrides) {
  const base = BUNDLES[locale] ?? BUNDLES[DEFAULT_LOCALE];
  if (!overrides) return base;
  return mergeDeep(base, overrides);
}

function mergeDeep(base, patch) {
  const out = { ...base };
  for (const [key, value] of Object.entries(patch ?? {})) {
    out[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mergeDeep(base[key] ?? {}, value)
        : value;
  }
  return out;
}

const CopyContext = createContext(BUNDLES[DEFAULT_LOCALE]);

export const CopyProvider = CopyContext.Provider;

/** The studio's strings, in the language this instance was asked for. */
export function useCopy() {
  return useContext(CopyContext);
}

const LocaleContext = createContext({ locale: DEFAULT_LOCALE, dir: 'ltr', isRTL: false });

export const LocaleContextProvider = LocaleContext.Provider;

/** The language this instance is in, and which way it reads. */
export function useStudioLocale() {
  return useContext(LocaleContext);
}

/**
 * Pick the right string from a value that may be a plain string or a map of
 * locale to string.
 *
 * Tenant data arrives in both shapes: a board called "Natural kraft" in every
 * language is a string, and one whose name differs is a map. Accepting both
 * keeps a small config small.
 */
export function localize(value, locale, fallback = DEFAULT_LOCALE) {
  if (value == null || typeof value === 'string') return value;
  return value[locale] ?? value[fallback] ?? Object.values(value)[0];
}

export { en, ar };
