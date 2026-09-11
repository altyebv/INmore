# The embed

The studio, on someone else's product page.

```html
<div id="studio" data-sku="paper-cup-8oz"></div>
<script src="https://studio.example.com/embed.js" data-tenant="inmore"></script>
```

That is the whole integration. The script renders a button; the studio loads
when a visitor presses it.

## What it costs the page

| | |
|---|---|
| `embed.js` | **4.7 kB** (2.2 kB gzipped) — all a product page ever downloads |
| the frame | 158 kB, when the studio is opened |
| the studio | 1.02 MB, only after WebGL, config, SKU and licence all pass |

A page with a studio on it that nobody opens pays 2.2 kB. A studio that cannot
run — no WebGL, a SKU that is not configured, a tenant that does not exist —
costs the frame and a JSON file, and never the renderer. That ordering is the
design; see the comment at the top of `src/frame.jsx`.

## Options

Set on the script tag (applies to every studio on the page) or on the target
element (applies to that one). The element wins.

| Attribute | Default | |
|---|---|---|
| `data-tenant` | — | **Required.** Which client's config to load. |
| `data-sku` | — | **Required, on the element.** Which product to open. |
| `data-locale` | the tenant's default | |
| `data-open` | `lazy` | `eager` skips the button and loads immediately. |
| `data-height` | `640px` | |
| `data-label` | `Customise this product` | The button's text. |
| `data-title` | `Product studio` | The iframe's accessible name. |

## Driving it from the page

```js
const studio = InmoreStudio.get('#studio');

studio.on('ready',        ({ tenant, sku, locale }) => {});
studio.on('submit',       (payload) => addToBasket(payload));
studio.on('configChange', ({ name, data }) => {});
studio.on('error',        ({ code, message }) => {});

studio.mount();                       // open it yourself
studio.setLocale('ar');
studio.setSku('shopping-bag-paper');
studio.destroy();
```

`on()` returns an unsubscribe function. `get()` works before the page has
finished loading — it enhances the element if the loader has not reached it
yet, so a host's own script does not have to wait for `DOMContentLoaded`.

`ready` fires once. Commands sent before it are queued and delivered when the
studio is up, so a host never has to ask whether it is safe to call something.

## The submit payload

```json
{
  "tenant": "inmore",
  "sku": "shopping-bag-paper",
  "locale": "en",
  "materials": { "body": "#c8ab84" },
  "decorations": [{ "zoneId": "primary", "assetHash": "...", "placement": { "widthMm": 96, "xMm": -12, "yMm": 4, "rotation": 0, "repeat": 1 }, "area": { "widthMm": 190, "heightMm": 240, "bleedMm": 3 } }],
  "options": {},
  "previews": { "thumbnail": null }
}
```

The placement is in millimetres on purpose: it means the same thing to a
server compositing onto a dieline at 300 dpi as it does to the canvas that drew
it. See `packages/engine/src/artwork/submitPayload.js`.

## Why an iframe

Not for CSS isolation — the studio's styles are self-contained and proven so by
`apps/site/isolation.html`. It is because a studio has to own a *document*: it
sets direction on its root, pins a sheet to the viewport on touch layouts, and
listens for keys. Doing that inside a client's page means fighting a theme we
cannot see for control of things we do not own.

The cost is a message bridge instead of a function call, and two consequences
worth knowing:

- **Drag-and-drop must land inside the studio.** A file dropped on the host's
  page will not reach it.
- **Nothing large crosses the bridge.** A preview thumbnail as a data URL would
  be megabytes through a structured clone on the host's main thread. Previews
  travel as references.

## Developing

```bash
npm run build:embed     # embed.js, the frame, and the tenant configs
npm run preview:embed   # then open http://localhost:4173/demo.html
```

`demo.html` is a deliberately hostile host page — `content-box` on everything,
yellow dashed buttons, `img { width: 100% !important }`, a ridged border on
every iframe — with four studios on it: the documented snippet, one driven by
the host's own controls, a SKU that does not exist, and a tenant that does not
exist. If it behaves there it will behave on a WooCommerce store.
