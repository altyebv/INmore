import { ERROR_CODES } from './protocol';

/**
 * What a visitor sees when the studio cannot start.
 *
 * This is the part of an embed that runs on someone else's live product page
 * on the day something is wrong, which makes it worth more care than its size
 * suggests. Three rules:
 *
 * 1. **Never a blank box.** A studio that fails silently looks like a broken
 *    site, and the client gets the support ticket.
 * 2. **Say what the visitor can do**, which is usually "nothing, but here is
 *    who to talk to" — and never show them a stack trace.
 * 3. **Say what the *client* can do**, in the console, where the person who
 *    pasted the snippet will look. A visitor cannot fix a typo'd tenant name;
 *    the developer who deployed it can, in a minute, if told which one.
 */

/** Copy for each way this can go wrong, in the visitor's language where we have it. */
const MESSAGES = {
  [ERROR_CODES.NO_WEBGL]: {
    en: {
      title: 'This browser cannot show 3D',
      body: 'The product preview needs WebGL, which is turned off or unavailable here. Everything else on this page still works.',
    },
    ar: {
      title: 'هذا المتصفح لا يدعم العرض ثلاثي الأبعاد',
      body: 'تحتاج معاينة المنتج إلى WebGL، وهو غير متاح أو معطّل هنا. بقية الصفحة تعمل كالمعتاد.',
    },
  },
  [ERROR_CODES.CONFIG_UNREACHABLE]: {
    en: {
      title: 'The studio is unavailable',
      body: 'We could not load this shop’s product setup. Please try again shortly.',
    },
    ar: {
      title: 'الاستوديو غير متاح',
      body: 'تعذّر تحميل إعدادات منتجات هذا المتجر. يرجى المحاولة بعد قليل.',
    },
  },
  [ERROR_CODES.CONFIG_INVALID]: {
    en: {
      title: 'The studio is unavailable',
      body: 'This shop’s product setup could not be read. We have been notified.',
    },
    ar: {
      title: 'الاستوديو غير متاح',
      body: 'تعذّرت قراءة إعدادات منتجات هذا المتجر. تم إبلاغنا بالمشكلة.',
    },
  },
  [ERROR_CODES.UNKNOWN_SKU]: {
    en: {
      title: 'Nothing to customise here',
      body: 'This product is not set up for customisation yet.',
    },
    ar: {
      title: 'لا يوجد ما يمكن تخصيصه',
      body: 'هذا المنتج غير مهيّأ للتخصيص بعد.',
    },
  },
  [ERROR_CODES.UNLICENSED]: {
    en: {
      title: 'The studio is unavailable',
      body: 'This studio is not licensed for this site.',
    },
    ar: {
      title: 'الاستوديو غير متاح',
      body: 'هذا الاستوديو غير مرخّص لهذا الموقع.',
    },
  },
  [ERROR_CODES.UNKNOWN]: {
    en: {
      title: 'The studio is unavailable',
      body: 'Something went wrong starting the product preview.',
    },
    ar: {
      title: 'الاستوديو غير متاح',
      body: 'حدث خطأ أثناء تشغيل معاينة المنتج.',
    },
  },
};

/**
 * What the person who pasted the snippet needs to know.
 *
 * Kept apart from the visitor copy on purpose: these name our internals and
 * our tooling, and belong in a console rather than on a shop's product page.
 */
const DEVELOPER_HINTS = {
  [ERROR_CODES.CONFIG_UNREACHABLE]: (d) =>
    `Could not fetch the tenant config for "${d.tenant}". Check data-tenant on the script tag, and that ${d.url} is deployed and readable.`,
  [ERROR_CODES.CONFIG_INVALID]: (d) =>
    `The tenant config for "${d.tenant}" failed validation. Run \`npm run tenants:check ${d.tenant}.json\` to see every problem.\n${d.detail ?? ''}`,
  [ERROR_CODES.UNKNOWN_SKU]: (d) =>
    `No product with sku "${d.sku}" in tenant "${d.tenant}". Known skus: ${d.known?.join(', ') || 'none'}. Check data-sku on the target element.`,
  [ERROR_CODES.UNLICENSED]: (d) =>
    `"${d.tenant}" is not licensed for ${d.host}. Add it to the tenant's licensed domains.`,
  [ERROR_CODES.NO_WEBGL]: () =>
    'WebGL is unavailable in this browser. Nothing to fix on the page — the studio degrades on purpose.',
};

export function developerHint(code, detail = {}) {
  return DEVELOPER_HINTS[code]?.(detail) ?? null;
}

/**
 * The visible fallback.
 *
 * Neutral rather than branded: the tenant's branding lives in a config we may
 * well have failed to load, and guessing at a brand we cannot read would look
 * worse than being plainly, obviously generic.
 */
export function Fallback({ code, locale = 'en', dir = 'ltr' }) {
  const copy = MESSAGES[code] ?? MESSAGES[ERROR_CODES.UNKNOWN];
  const text = copy[locale] ?? copy.en;

  return (
    <div
      dir={dir}
      role="status"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        justifyContent: 'center',
        minHeight: '100%',
        padding: '2rem',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        fontSize: '15px',
        lineHeight: 1.55,
        color: '#3d3d3a',
        background: '#f4f2ee',
      }}
    >
      <strong style={{ fontSize: '16px', color: '#1a1a18' }}>{text.title}</strong>
      <span style={{ maxWidth: '46ch' }}>{text.body}</span>
    </div>
  );
}

/**
 * Can this browser render the studio at all?
 *
 * Asked before anything heavy loads, because the answer decides whether to
 * load it.
 *
 * The probe deliberately does *not* call `WEBGL_lose_context.loseContext()` to
 * tidy up after itself, which is the obvious thing to do and is wrong here.
 * Browsers share a pool of GPU contexts, and forcing one to be lost can take
 * the renderer that is created a moment later down with it — the symptom is a
 * "THREE.WebGLRenderer: Context Lost" and a studio that renders once and then
 * stops. Dropping the reference and letting the collector deal with it costs
 * one short-lived context and is reliable.
 */
export function hasWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export default Fallback;
