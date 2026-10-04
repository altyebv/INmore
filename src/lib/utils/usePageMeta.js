import { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, localeFromPath, localizePath } from '@/i18n/config';
import { SITE_URL } from '@/lib/site';

const OG_LOCALES = { en: 'en_US', ar: 'ar_QA' };

/**
 * Where a prerender collects what a page declared. Effects do not run on the
 * server, so there the hook writes into this object during render instead of
 * into the document.
 */
export const PageMetaContext = createContext(null);

/** Every URL-derived tag for a path: canonical, hreflang alternates, OG locale. */
export function pageUrls(pathname) {
  const path = pathname.replace(/(.)\/+$/, '$1');
  const locale = localeFromPath(path);
  const urlFor = (code) => `${SITE_URL}${localizePath(path, code)}`;

  return {
    locale,
    canonical: urlFor(locale),
    ogLocale: OG_LOCALES[locale],
    alternates: [
      ...LOCALE_CODES.map((code) => ({ hreflang: LOCALES[code].htmlLang, href: urlFor(code) })),
      { hreflang: 'x-default', href: urlFor(DEFAULT_LOCALE) },
    ],
  };
}

function upsert(selector, create) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
  }
  return tag;
}

function setMeta(attr, key, content) {
  const tag = upsert(`meta[${attr}="${key}"]`, () => {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    return el;
  });
  tag.setAttribute('content', content);
}

function setLink(rel, href, hreflang) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  const tag = upsert(selector, () => {
    const el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    return el;
  });
  tag.setAttribute('href', href);
}

/**
 * Set the document title, description and the per-URL SEO tags per route:
 * canonical, the hreflang pair that ties `/…` to `/ar/…`, and Open Graph.
 *
 * A small, dependency-free stand-in for a head manager. The build prerenders
 * the same tags into each page's HTML (see scripts/prerender.mjs); this keeps
 * them right as the visitor moves between routes.
 */
export function usePageMeta({ title, description, noindex = false }) {
  const { pathname } = useLocation();
  const sink = useContext(PageMetaContext);
  if (sink) Object.assign(sink, { title, description, noindex });

  useEffect(() => {
    if (title) {
      document.title = title;
      setMeta('property', 'og:title', title);
    }

    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
    }

    const { canonical, alternates, ogLocale } = pageUrls(pathname);

    setLink('canonical', canonical);
    alternates.forEach(({ hreflang, href }) => setLink('alternate', href, hreflang));

    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:locale', ogLocale);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow');
  }, [title, description, noindex, pathname]);
}

export default usePageMeta;
