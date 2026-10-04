import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '@/app/App';
import routes from '@/app/routes';
import { LOCALES, LocaleProvider, localeFromPath, localizePath } from '@/i18n';
import { SITE_URL } from '@/lib/site';
import structuredData from '@/lib/structuredData';
import { PageMetaContext, pageUrls } from '@/lib/utils/usePageMeta';

/**
 * The build's entry: renders one URL to HTML for scripts/prerender.mjs.
 *
 * Mirrors main.jsx's tree so the browser can hydrate what this wrote. The
 * stream is only read once everything has resolved, so code-split routes are
 * in the markup rather than their fallbacks.
 */
export function render(url) {
  const meta = {};

  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk, _encoding, done) {
        html += chunk;
        done();
      },
      final(done) {
        resolve({ html, meta });
        done();
      },
    });

    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <LocaleProvider initialLocale={localeFromPath(url)}>
          <PageMetaContext.Provider value={meta}>
            <App />
          </PageMetaContext.Provider>
        </LocaleProvider>
      </StaticRouter>,
      {
        onAllReady: () => stream.pipe(sink),
        onShellError: reject,
        onError: reject,
      }
    );
  });
}

/** Every indexable path, before localisation. */
export const paths = routes.map((route) => route.path).filter((path) => path !== '*');

export { LOCALES, SITE_URL, localizePath, pageUrls, structuredData };
