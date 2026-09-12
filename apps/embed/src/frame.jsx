import { StrictMode, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
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

/**
 * The page we are embedded in, as an origin: the only sender we listen to and
 * the only receiver we post to.
 *
 * The loader passes it explicitly. The referrer used to be the only source,
 * and a host page with `Referrer-Policy: no-referrer` — which privacy-minded
 * shops do set — sends none. That left this at '*', and with it the studio
 * took commands from any window and posted the visitor's configuration to
 * whatever happened to be its parent. The referrer remains the fallback, for
 * a frame loaded by an older copy of embed.js.
 *
 * Trusting a query parameter is safe here for a reason worth writing down: a
 * page that frames us and lies about its origin only makes postMessage refuse
 * to deliver to it. Nothing is gained by claiming to be someone else.
 */
function resolveParentOrigin() {
  for (const candidate of [params.get('origin'), document.referrer]) {
    if (!candidate) continue;
    try {
      const { origin } = new URL(candidate);
      if (origin && origin !== 'null') return origin;
    } catch {
      // Not a URL. Try the next source.
    }
  }
  return '*';
}

const parentOrigin = resolveParentOrigin();

function post(type, payload) {
  parent?.postMessage(studioMessage(type, payload), parentOrigin);
}

/** Tell the host — and the developer reading its console — what went wrong. */
function report(code, detail) {
  const hint = developerHint(code, { ...request, ...detail });
  if (hint) console.error(`[inmore-studio] ${hint}`);
  post(STUDIO_EVENTS.ERROR, { code, message: hint ?? code });
}

function fail(code, detail) {
  report(code, detail);
  return { status: 'failed', code };
}

const liveSkus = (config) =>
  config.products.filter((p) => p.status === 'live').map((p) => p.id);

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

  const live = liveSkus(config);
  if (request.sku && !live.includes(request.sku)) {
    return fail(ERROR_CODES.UNKNOWN_SKU, { known: live });
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

  /** The mounted studio's handle, for answering requestState. */
  const studioApi = useRef(null);
  /** The resolved config, readable from the message listener without re-subscribing it. */
  const configRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    resolveTenant().then((result) => {
      if (cancelled) return;
      if (result.status === 'ready') {
        configRef.current = result.config;
        setLocale(result.locale);
      }
      setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Commands from the host. */
  useEffect(() => {
    const onMessage = (event) => {
      // From our own parent, from the origin it was loaded by, tagged as ours.
      if (event.source !== window.parent) return;
      if (!isOurMessage(event, FROM_HOST, parentOrigin)) return;
      const { type, payload } = event.data;

      if (type === HOST_COMMANDS.SET_LOCALE && payload?.locale) setLocale(payload.locale);

      if (type === HOST_COMMANDS.SET_SKU && payload?.sku) {
        /*
         * A sku the tenant does not have used to be dropped without a word:
         * the host's button did nothing and nobody was told why. It is the
         * same mistake as a typo in data-sku, and gets the same answer.
         */
        const config = configRef.current;
        const known = config ? liveSkus(config) : [];
        if (config && !known.includes(payload.sku)) {
          report(ERROR_CODES.UNKNOWN_SKU, { sku: payload.sku, known });
          return;
        }
        setSku(payload.sku);
      }

      if (type === HOST_COMMANDS.REQUEST_STATE) {
        // Commands are held by the loader until the studio is ready, so the
        // handle is normally set; null says honestly that there is no studio.
        post(STUDIO_EVENTS.STATE, studioApi.current?.getState() ?? null);
      }
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

  const onEvent = useCallback((name, data) => {
    /*
     * Keep our copy of the sku level with what the visitor chose. The studio
     * acts on a sku when it changes, so without this a host's setSku() back to
     * the product the page opened on would be a value we already held — and
     * nothing would happen.
     */
    if (name === 'product:select' && data?.sku) setSku(data.sku);
    post(STUDIO_EVENTS.CONFIG_CHANGE, { name, data });
  }, []);

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
        apiRef={studioApi}
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
