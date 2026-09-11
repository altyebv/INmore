import {
  FROM_STUDIO,
  HOST_COMMANDS,
  STUDIO_EVENTS,
  hostMessage,
  isOurMessage,
} from './protocol';

/**
 * The snippet.
 *
 *   <div id="studio" data-sku="tumbler-500"></div>
 *   <script src="https://studio.example.com/embed.js" data-tenant="curated"></script>
 *
 * This file is the whole of what a client's product page downloads, and that
 * is the constraint it is written around. It imports nothing but the protocol,
 * touches no framework, and must stay a few kilobytes — because everything it
 * is a loader *for* is three-quarters of a megabyte of three.js, and a product
 * page that pays for that before anyone asks to see a product is a product
 * page we have made slower for nothing.
 *
 * So: the snippet renders a button. The iframe — and everything in it — is
 * created when the visitor asks for it, or immediately if the page says
 * `data-open="eager"`.
 *
 * The iframe is not a convenience. A studio in a host page has to own a
 * document: it sets direction on its root, pins a sheet to the viewport on
 * touch layouts, and listens for keys. Doing that inside someone else's
 * document means fighting a theme we cannot see for control of things we do
 * not own. An iframe hands it a document, and the cost — a message bridge
 * instead of a function call — is one we can describe in a file this size.
 */

const VERSION = '0.1.0';

/* --- Where we are ------------------------------------------------------------ */

/**
 * The script tag that loaded us.
 *
 * `document.currentScript` is correct during synchronous execution and null
 * afterwards, so it is read once at module scope. The fallback covers a host
 * that injected the script dynamically, where currentScript is null.
 */
const self =
  document.currentScript ??
  [...document.querySelectorAll('script[src]')].find((s) => /embed(\.\w+)?\.js/.test(s.src));

const origin = self ? new URL(self.src, location.href).origin : location.origin;
const frameUrl = new URL('frame.html', new URL(self?.src ?? location.href, location.href));

/* --- Styling ------------------------------------------------------------------ */

/**
 * Deliberately minimal, and deliberately not branded.
 *
 * Everything the studio looks like is inside the iframe, where a theme cannot
 * reach it. Out here we are a guest in someone's stylesheet: the placeholder
 * inherits the host's font so it does not look pasted in, and sets only what
 * it must. `all: initial` on the button would look alien; leaving it unstyled
 * would let a theme make it unrecognisable. This is the middle.
 */
const STYLE_ID = 'inmore-studio-style';
const CSS = `
.inmore-studio{position:relative;width:100%;overflow:hidden}
.inmore-studio-frame{display:block;width:100%;border:0;margin:0;background:transparent}
.inmore-studio-open{
  display:inline-flex;align-items:center;gap:.5em;
  font:inherit;font-weight:600;line-height:1.2;
  padding:.75em 1.25em;cursor:pointer;
  color:#fff;background:#111;border:1px solid #111;border-radius:6px;
}
.inmore-studio-open:hover{opacity:.88}
.inmore-studio-open:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.inmore-studio-note{
  font:inherit;font-size:.9em;line-height:1.5;
  padding:1em 1.25em;border:1px solid rgba(128,128,128,.35);border-radius:6px;
  color:inherit;background:rgba(128,128,128,.06);
}
.inmore-studio-note b{display:block;margin-bottom:.25em}
`;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/* --- A single embed ----------------------------------------------------------- */

const instances = new Map();
let nextId = 0;

/**
 * @param {HTMLElement} element The host's target div.
 * @param {object} options
 */
function createInstance(element, options) {
  const id = `inmore-${(nextId += 1)}`;
  const listeners = new Map();
  let frame = null;
  let destroyed = false;
  let ready = false;
  const queued = [];

  const emit = (event, payload) => {
    for (const fn of listeners.get(event) ?? []) {
      try {
        fn(payload);
      } catch (error) {
        // A host's callback throwing is the host's problem, not ours — but it
        // must not take the studio down with it.
        console.error('[inmore-studio] listener for', event, 'threw:', error);
      }
    }
  };

  const send = (type, payload) => {
    const message = hostMessage(type, payload);
    if (!ready || !frame?.contentWindow) {
      queued.push(message);
      return;
    }
    frame.contentWindow.postMessage(message, origin);
  };

  const onMessage = (event) => {
    if (destroyed) return;
    if (!frame || event.source !== frame.contentWindow) return;
    if (!isOurMessage(event, FROM_STUDIO, origin)) return;

    const { type, payload } = event.data;

    if (type === STUDIO_EVENTS.READY) {
      ready = true;
      for (const message of queued.splice(0)) {
        frame.contentWindow.postMessage(message, origin);
      }
    }

    if (type === STUDIO_EVENTS.RESIZE) {
      if (frame && Number.isFinite(payload?.height)) {
        frame.style.height = `${payload.height}px`;
      }
      return;
    }

    emit(type, payload);
  };

  /** Replace the target's contents. The host gave us this element to fill. */
  const render = (node) => {
    element.textContent = '';
    element.appendChild(node);
  };

  const placeholder = () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inmore-studio-open';
    button.textContent = options.label;
    button.addEventListener('click', () => api.mount());
    return button;
  };

  const api = {
    id,
    element,

    /** Create the iframe and start loading the studio. */
    mount() {
      if (destroyed || frame) return api;

      const url = new URL(frameUrl);
      url.searchParams.set('tenant', options.tenant);
      if (options.sku) url.searchParams.set('sku', options.sku);
      if (options.locale) url.searchParams.set('locale', options.locale);
      // The frame is licensed against the page it is embedded in, not against
      // its own origin — which is the same for every client.
      url.searchParams.set('host', location.hostname);

      frame = document.createElement('iframe');
      frame.className = 'inmore-studio-frame';
      frame.src = url.toString();
      frame.title = options.title;
      frame.style.height = options.height;
      frame.allow = 'fullscreen; xr-spatial-tracking';
      /*
       * Worth being precise about, because browsers warn on it.
       *
       * "allow-scripts" plus "allow-same-origin" means this is not a security
       * sandbox: the frame can reach its own origin, which is what it needs to
       * fetch a tenant config without CORS and read back its own canvas. The
       * browser says so in the console, and it is right.
       *
       * What the attribute still buys is real, though: no top-level
       * navigation, no popups, no form submission into the host's document. A
       * compromised bundle cannot redirect a client's shop. That is worth
       * having even when the isolation is not absolute.
       */
      frame.setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-downloads allow-popups-to-escape-sandbox'
      );
      frame.setAttribute('loading', 'eager');

      render(frame);
      return api;
    },

    /** Remove the studio and release everything it holds. */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.removeEventListener('message', onMessage);
      instances.delete(element);
      element.textContent = '';
      frame = null;
      listeners.clear();
    },

    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => listeners.get(event)?.delete(handler);
    },

    off(event, handler) {
      listeners.get(event)?.delete(handler);
      return api;
    },

    setLocale(locale) {
      send(HOST_COMMANDS.SET_LOCALE, { locale });
      return api;
    },

    setSku(sku) {
      send(HOST_COMMANDS.SET_SKU, { sku });
      return api;
    },

    /** Ask the studio for its current configuration without submitting. */
    requestState() {
      send(HOST_COMMANDS.REQUEST_STATE, {});
      return api;
    },
  };

  window.addEventListener('message', onMessage);
  instances.set(element, api);

  if (options.open === 'eager') api.mount();
  else render(placeholder());

  return api;
}

/* --- Wiring up what is on the page --------------------------------------------- */

function optionsFor(element) {
  const script = self;
  const read = (name, fallback) =>
    element.dataset[name] ?? script?.dataset[name] ?? fallback;

  return {
    tenant: read('tenant'),
    sku: element.dataset.sku,
    locale: read('locale'),
    open: read('open', 'lazy'),
    height: read('height', '640px'),
    label: read('label', 'Customise this product'),
    title: read('title', 'Product studio'),
  };
}

function enhance(element) {
  if (instances.has(element)) return instances.get(element);

  const options = optionsFor(element);

  if (!options.tenant) {
    // A missing tenant is a snippet that was pasted wrong, and the person who
    // can fix it is reading the console on the page it is broken on.
    console.error(
      '[inmore-studio] no tenant. Add data-tenant to the script tag, or to the target element.'
    );
    return null;
  }

  element.classList.add('inmore-studio');
  return createInstance(element, options);
}

/** Every element that has asked for a studio. */
function targets(root = document) {
  return [...root.querySelectorAll('[data-sku]')].filter(
    (el) => !el.matches('script') && !instances.has(el)
  );
}

function boot() {
  injectStyle();
  targets().forEach(enhance);
}

/* --- The global ---------------------------------------------------------------- */

/**
 * One global, named after the product.
 *
 * A host that only wants the snippet never touches it. A host that wants to
 * drive the studio — open it from their own button, switch language with their
 * own picker, put the payload in their basket — uses this.
 */
const InmoreStudio = {
  version: VERSION,

  /** Enhance a specific element, or everything on the page. */
  mount(target, options) {
    injectStyle();
    if (!target) return targets().map(enhance).filter(Boolean);

    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return null;
    if (options) Object.assign(element.dataset, options);
    return enhance(element);
  },

  /**
   * The instance for an element.
   *
   * Enhances it if it has not been picked up yet. A host's own script usually
   * runs immediately after the snippet — before DOMContentLoaded, and so
   * before boot() — and making them think about that ordering to get a handle
   * is an API asking to be got wrong.
   */
  get(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return null;
    return instances.get(element) ?? (element.dataset.sku ? enhance(element) : null);
  },

  /** Tear everything down. */
  destroyAll() {
    for (const instance of [...instances.values()]) instance.destroy();
  },

  /** Pick up studios added to the page after we loaded. */
  scan: boot,
};

window.InmoreStudio = InmoreStudio;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export default InmoreStudio;
