import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App';
import { LocaleProvider, localizePath, resolveInitialLocale } from '@/i18n';
import '@/styles/global.css';

/*
 * The URL is the source of truth for language. A returning visitor whose
 * remembered choice disagrees with the path they landed on is moved to the
 * matching URL before the router mounts, so a page is never rendered in one
 * language under the other's address.
 */
const { pathname, search, hash } = window.location;
const params = new URLSearchParams(search);
params.delete('lang');
const query = params.toString();
const target = `${localizePath(pathname, resolveInitialLocale())}${query ? `?${query}` : ''}${hash}`;
if (target !== `${pathname}${search}${hash}`) {
  window.history.replaceState(window.history.state, '', target);
}

const app = (
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>
);

/*
 * The build prerenders each route and marks the markup with the path it was
 * made for. Hydrate only when that is the page about to be drawn: not after
 * the language redirect above, not on the not-found fallback, and not when
 * the route carries history state (a design on its way to the order page)
 * that the prerender could not have known about.
 */
const container = document.getElementById('root');
const here = window.location.pathname.replace(/(.)\/+$/, '$1');

if (container.dataset.prerendered === here && !window.history.state?.usr) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
