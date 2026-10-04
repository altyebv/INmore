/**
 * Locale configuration.
 *
 * One place decides which languages exist, which is default, and how each
 * behaves. Adding a third language means adding an entry here and a content
 * module beside it.
 */

export const LOCALES = {
  en: { code: 'en', dir: 'ltr', label: 'English', short: 'EN', htmlLang: 'en', pathPrefix: '' },
  ar: { code: 'ar', dir: 'rtl', label: 'العربية', short: 'ع', htmlLang: 'ar', pathPrefix: '/ar' },
};

export const LOCALE_CODES = Object.keys(LOCALES);

export const DEFAULT_LOCALE = 'en';

export const STORAGE_KEY = 'inmore.locale';

export function isLocale(code) {
  return LOCALE_CODES.includes(code);
}

export function localeFromPath(pathname = '/') {
  return pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : DEFAULT_LOCALE;
}

export function stripLocaleFromPath(pathname = '/') {
  if (pathname === '/ar') return '/';
  if (pathname.startsWith('/ar/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export function localizePath(path = '/', locale = DEFAULT_LOCALE) {
  if (typeof path !== 'string') return path;
  if (!path.startsWith('/') || path.startsWith('//')) return path;

  const [pathAndSearch, hash = ''] = path.split('#');
  const [pathname, search = ''] = pathAndSearch.split('?');
  const cleanPath = stripLocaleFromPath(pathname);
  const prefix = LOCALES[locale]?.pathPrefix ?? '';
  const localized = prefix ? `${prefix}${cleanPath === '/' ? '' : cleanPath}` : cleanPath;
  return `${localized || '/'}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
}

/**
 * Resolve the locale for this visit.
 *
 * Reads, in order: the URL path, then an explicit `?lang=` override for QA,
 * then the visitor's remembered choice, then the default. Browser language is
 * deliberately not consulted — a bilingual visitor should always land on the
 * same page they were last shown.
 */
export function resolveInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const fromPath = localeFromPath(window.location.pathname);
  if (fromPath !== DEFAULT_LOCALE) return fromPath;

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
