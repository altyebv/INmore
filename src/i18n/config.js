/**
 * Locale configuration.
 *
 * One place decides which languages exist, which is default, and how each
 * behaves. Adding a third language means adding an entry here and a content
 * module beside it.
 */

export const LOCALES = {
  en: { code: 'en', dir: 'ltr', label: 'English', short: 'EN', htmlLang: 'en' },
  ar: { code: 'ar', dir: 'rtl', label: 'العربية', short: 'ع', htmlLang: 'ar' },
};

export const LOCALE_CODES = Object.keys(LOCALES);

export const DEFAULT_LOCALE = 'en';

export const STORAGE_KEY = 'inmore.locale';

export function isLocale(code) {
  return LOCALE_CODES.includes(code);
}

/**
 * Resolve the locale for this visit.
 *
 * Reads, in order: an explicit `?lang=` override (useful for sharing and for
 * QA), then the visitor's remembered choice, then the default. Browser
 * language is deliberately not consulted — a bilingual visitor should always
 * land on the same page they were last shown.
 *
 * When Arabic later moves to its own `/ar/*` routes, this function is where
 * the path segment is read; nothing else in the app needs to change.
 */
export function resolveInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  if (isLocale(fromQuery)) return fromQuery;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Private browsing or blocked storage — fall through to the default.
  }

  return DEFAULT_LOCALE;
}
