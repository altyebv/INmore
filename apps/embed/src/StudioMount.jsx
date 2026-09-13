import { useEffect, useMemo, useRef } from 'react';
import { Studio, Button, createCatalogue, domainLicense } from '@inmore/engine';

/**
 * Everything expensive, in one lazily-imported module.
 *
 * This file exists to be the boundary of a dynamic import rather than for what
 * it contains. `@inmore/engine` pulls three.js, fiber and drei — about 1.1 MB
 * raw — and anything that imports it statically drags all of that into its own
 * chunk. Keeping the import here means the frame's entry chunk stays small and
 * a studio that fails its preflight checks never downloads a renderer.
 *
 * It is also where an embedded studio differs from the site's, and the
 * differences are all about not being the page:
 *
 * - `fullscreen` is false. The frame is the viewport; the studio fills it in
 *   flow rather than pinning itself over anything.
 * - The CTA reports to the host instead of navigating. An embed has nowhere to
 *   navigate *to* — the host decides what a finished configuration means, and
 *   finds out through `onSubmit`.
 */
export function StudioMount({
  config,
  sku,
  locale,
  dir,
  dracoPath,
  apiRef,
  onReady,
  onSubmit,
  onEvent,
}) {
  const catalogue = useMemo(
    () => createCatalogue({ products: config.products, stocks: config.stocks }),
    [config]
  );

  /*
   * The engine's licence seam, given the host page's hostname.
   *
   * The frame has already refused to mount an unlicensed embed, so by here
   * this is belt and braces — but it is the seam a stricter policy would use,
   * and wiring it now means a future change is a change to this object rather
   * than a change to the engine.
   */
  const license = useMemo(
    () =>
      domainLicense({
        tenant: config.tenant,
        domains: config.licensedDomains,
        hostname: new URLSearchParams(location.search).get('host') ?? '',
      }),
    [config]
  );

  /*
   * `ready` means the studio is mounted and usable, which is only true once
   * this component has rendered — not when the module finished loading.
   *
   * Fired exactly once, guarded by a ref rather than by an effect dependency.
   * A host listening for `ready` is waiting to reveal the studio or stop a
   * spinner, and that is a one-time event; keying the effect on the callback's
   * identity announced it again every time the host changed language, which
   * says something the host did not ask about and would eventually be relied
   * on as if it meant something.
   */
  const announced = useRef(false);
  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    onReady?.();
  }, [onReady]);

  const cta = useMemo(
    () =>
      ({ submit, block, size }) => (
        <Button variant="primary" block={block} size={size} onClick={submit}>
          {locale === 'ar' ? 'أضِف إلى الطلب' : 'Add to order'}
        </Button>
      ),
    [locale]
  );

  return (
    <Studio
      tenant={config.tenant}
      catalogue={catalogue}
      branding={config.branding}
      sku={sku}
      locale={locale}
      dir={dir}
      assetBase={config.assetBase}
      dracoPath={dracoPath}
      license={license}
      apiRef={apiRef}
      renderCta={cta}
      onSubmit={onSubmit}
      onEvent={onEvent}
      className="embedded"
    />
  );
}

export default StudioMount;
