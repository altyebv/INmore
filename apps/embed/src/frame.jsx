import { StrictMode, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { assertValidTenantConfig } from '@inmore/config-schema';
import { Fallback, developerHint, hasWebGL } from './fallback';
import {
  ERROR_CODES,
  FROM_HOST,
  HOST_COMMANDS,
  STUDIO_EVENTS,
  isOurMessage,
  studioMessage,
} from './protocol';

/**
 * The studio, inside the iframe.
 *
 * The loader created this document; this file decides whether there is a
 * studio to show and, if so, gets out of its way.
 *
 * The order of operations here is the whole design. Each check is cheap and
 * happens before anything expensive, so the common failures — a typo'd tenant,
 * a SKU that is not configured, a browser without WebGL — cost a fetch at
 * most and never the 3-D bundle:
 *
 *   1. Is WebGL available?          — a canvas, discarded immediately
 *   2. Does the tenant config load? — one fetch
 *   3. Is it valid?                 — pure JavaScript
 *   4. Is the SKU in it?            — a lookup
 *   5. Is this domain licensed?     — a string comparison
 *   6. ...only now, load three.js.
 *
 * Getting that order wrong would mean a visitor on a browser without WebGL
 * downloading three-quarters of a megabyte to be told they cannot use it.
 */

/*
 * The engine, and everything under it, behind a dynamic import.
 *
 * This is the single most important line in the app. `@inmore/engine` pulls
 * three.js, @react-three/fiber and drei — around 1.1 MB raw. Importing it at
 * the top of this module would put all of it in the frame's entry chunk, so a
 * frame that fails at step 1 would already have paid for it.
 */
const StudioMount = lazy(() => import('./StudioMount'));

/* --- Reading the situation ----------------------------------------------------- */

const params = new URLSearchParams(location.search);

const request = {
  tenant: params.get('tenant'),
  sku: params.get('sku') || undefined,
  locale: params.get('locale') || undefined,
  /** The page we are embedded in — what a licence is actually about. */
  host: params.get('host') || '',
};

/** Where a tenant's config lives, relative to this frame. */
const configUrl = (tenant) => new URL(`tenants/${tenant}.json`, location.href).toString();

/** Only the parent may talk to us, and only from where we were served. */
const parentOrigin = document.referrer ? new URL(document.referrer).origin : '*';

function post(type, payload) {
  parent?.postMessage(studioMessage(type, payload), parentOrigin);
}

function fail(code, detail) {
  const hint = developerHint(code, { ...request, ...detail });
  if (hint) console.error(`[inmore-studio] ${hint}`);
  post(STUDIO_EVENTS.ERROR, { code, message: hint ?? code });
  return { status: 'failed', code };
}

/* --- Loading ------------------------------------------------------------------- */

async function resolveTenant() {
  if (!request.tenant) {
    return fail(ERROR_CODES.CONFIG_UNREACHABLE, { url: '(no tenant given)' });
  }

  if (!hasWebGL()) return fail(ERROR_CODES.NO_WEBGL);

  const url = configUrl(request.tenant);

  let raw;
  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) return fail(ERROR_CODES.CONFIG_UNREACHABLE, { url });
    raw = await response.json();
  } catch {
    return fail(ERROR_CODES.CONFIG_UNREACHABLE, { url });
  }

  let config;
  try {
    config = assertValidTenantConfig(raw, { label: `${request.tenant}.json` });
  } catch (error) {
    return fail(ERROR_CODES.CONFIG_INVALID, { detail: error.message });
  }

  const live = config.products.filter((p) => p.status === 'live');
  if (request.sku && !live.some((p) => p.id === request.sku)) {
    return fail(ERROR_CODES.UNKNOWN_SKU, { known: live.map((p) => p.id) });
  }
  if (!live.length) {
    return fail(ERROR_CODES.UNKNOWN_SKU, { known: [] });
  }

  /*
   * The licence check, such as it is.
   *
   * A hostname comparison any visitor could defeat with devtools — which is
   * fine, because it is not a security boundary and building it as one would
   * be the mistake. It exists so that an embed deployed on a domain nobody
   * licensed is visible to the people running it, rather than quietly working
   * forever.
   */
  const domains = config.licensedDomains;
  if (domains?.length) {
    const host = request.host;
    const allowed = domains.some((d) => host === d || host.endsWith(`.${d}`));
    if (!allowed) return fail(ERROR_CODES.UNLICENSED, { host });
  }

  const locale =
    request.locale && config.locales.includes(request.locale)
      ? request.locale
      : config.defaultLocale;

  return { status: 'ready', config, locale };
}

/* --- The frame ------------------------------------------------------------------ */

function Frame() {
  const [state, setState] = useState({ status: 'loading' });
  const [locale, setLocale] = useState(request.locale ?? 'en');
  const [sku, setSku] = useState(request.sku);

  useEffect(() => {
    let cancelled = false;
    resolveTenant().then((result) => {
      if (cancelled) return;
      setState(result);
      if (result.status === 'ready') setLocale(result.locale);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Commands from the host. */
  useEffect(() => {
    const onMessage = (event) => {
      if (!isOurMessage(event, FROM_HOST, parentOrigin)) return;
      const { type, payload } = event.data;

      if (type === HOST_COMMANDS.SET_LOCALE && payload?.locale) setLocale(payload.locale);
      if (type === HOST_COMMANDS.SET_SKU && payload?.sku) setSku(payload.sku);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // The frame owns this document, so here it is allowed to set these.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const ready = state.status === 'ready';
  const tenant = ready ? state.config.tenant : null;

  /*
   * Memoised because StudioMount fires it from an effect keyed on identity.
   * An inline arrow changes every render, so READY would be posted again each
   * time the host changed language or product — and a host counting 'ready'
   * events to know when to show the studio would be told repeatedly.
   */
  const onReady = useCallback(
    () => post(STUDIO_EVENTS.READY, { tenant, sku, locale }),
    [tenant, sku, locale]
  );

  const onSubmit = useCallback((payload) => post(STUDIO_EVENTS.SUBMIT, payload), []);
  const onEvent = useCallback(
    (name, data) => post(STUDIO_EVENTS.CONFIG_CHANGE, { name, data }),
    []
  );

  if (state.status === 'loading') return null;
  if (state.status === 'failed') {
    return <Fallback code={state.code} locale={locale} dir={dir} />;
  }

  return (
    <Suspense fallback={null}>
      <StudioMount
        config={state.config}
        sku={sku}
        locale={locale}
        dir={dir}
        onReady={onReady}
        onSubmit={onSubmit}
        onEvent={onEvent}
      />
    </Suspense>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Frame />
  </StrictMode>
);
