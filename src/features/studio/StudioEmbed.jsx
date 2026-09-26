import { useEffect, useRef } from 'react';

/**
 * The configurator, on this page, through Qreate's embed.
 *
 * The website does not contain the configurator; it hosts it, the way any
 * client's product page would. `embed.js` is loaded from wherever Qreate is
 * deployed (`VITE_QREATE_URL`), pointed at a div, and talked to over its
 * postMessage bridge. Everything about the studio's inner workings is
 * Qreate's; what is here is only the seam.
 *
 * The div is deliberately empty of React children: the loader owns its
 * contents and replaces them at will.
 */

const QREATE_URL = (import.meta.env.VITE_QREATE_URL ?? 'http://localhost:5174').replace(/\/$/, '');

let loading;

/** Load embed.js once per page, however many times the studio mounts. */
function loadEmbed() {
  if (window.InmoreStudio) return Promise.resolve(window.InmoreStudio);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${QREATE_URL}/embed.js`;
    script.async = true;
    script.onload = () => resolve(window.InmoreStudio);
    script.onerror = () => {
      loading = undefined;
      reject(new Error(`Could not load the studio from ${QREATE_URL}/embed.js`));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function StudioEmbed({ tenant, sku, locale, height, onSubmit, className }) {
  const host = useRef(null);
  const studio = useRef(null);

  // Latest handler without re-mounting the studio when the parent re-renders.
  const submit = useRef(onSubmit);
  submit.current = onSubmit;

  useEffect(() => {
    let cancelled = false;
    let off;

    loadEmbed()
      .then((InmoreStudio) => {
        if (cancelled || !host.current) return;
        // The div already carries the options as data attributes, which is also
        // how the loader's own page scan reads them — so `get` returns the
        // instance that scan made, or makes it.
        studio.current = InmoreStudio.get(host.current);
        off = studio.current?.on('submit', (payload) => submit.current?.(payload));
      })
      .catch((error) => {
        if (host.current) host.current.textContent = error.message;
      });

    return () => {
      cancelled = true;
      off?.();
      studio.current?.destroy();
      studio.current = null;
    };
    // The studio is mounted once per tenant/sku/height; locale changes are sent as commands below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, sku, height]);

  useEffect(() => {
    studio.current?.setLocale(locale);
  }, [locale]);

  return (
    <div
      ref={host}
      className={className}
      data-tenant={tenant}
      data-sku={sku}
      data-locale={locale}
      data-height={height}
      data-open="eager"
    />
  );
}

export default StudioEmbed;
