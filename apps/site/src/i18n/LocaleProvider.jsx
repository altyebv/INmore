import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './content/en';
import ar from './content/ar';
import { DEFAULT_LOCALE, LOCALES, STORAGE_KEY, isLocale, resolveInitialLocale } from './config';

const CONTENT = { en, ar };

const LocaleContext = createContext(null);

/**
 * Owns the active locale and keeps the document in sync with it.
 *
 * Content is a plain object per language rather than a key lookup with
 * fallbacks: a missing translation is then a build-time shape mismatch we can
 * see, not a silent English string leaking into an Arabic page.
 */
export function LocaleProvider({ children, initialLocale }) {
  const [locale, setLocaleState] = useState(
    () => (isLocale(initialLocale) ? initialLocale : resolveInitialLocale())
  );

  const meta = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];

  // The document element carries language and direction for the whole app:
  // CSS logical properties, text selection, form controls and screen readers
  // all take their cue from it.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = meta.htmlLang;
    root.dir = meta.dir;
    root.dataset.locale = meta.code;
  }, [meta]);

  const setLocale = useCallback((next) => {
    if (!isLocale(next)) return;
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — the choice simply does not survive a reload.
    }
  }, []);

  const value = useMemo(() => {
    const content = CONTENT[locale] ?? CONTENT[DEFAULT_LOCALE];
    const other = locale === 'en' ? 'ar' : 'en';
    return {
      locale,
      dir: meta.dir,
      isRTL: meta.dir === 'rtl',
      meta,
      content,
      t: content.ui,
      setLocale,
      toggleLocale: () => setLocale(other),
      otherLocale: LOCALES[other],
    };
  }, [locale, meta, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside a LocaleProvider.');
  return context;
}

/** Convenience for components that only need copy. */
export function useContent() {
  return useLocale().content;
}

/** Convenience for components that only need UI strings. */
export function useT() {
  return useLocale().t;
}

export default LocaleProvider;
