import { Suspense, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PROXY_REGISTRY } from './models/PaperCupProxy';
import GlbProductModel from './models/GlbProductModel';
import GlbLoadBoundary from './models/GlbLoadBoundary';
import useModelAvailability from './models/useModelAvailability';

/**
 * Resolve a product configuration into geometry.
 *
 * Presentation code never asks "is there a GLB yet?" — it asks for a product
 * and gets the best available representation of it.
 *
 * The availability probe exists only to decide whether to fall back to proxy
 * geometry. A product with no proxy always goes to its GLB: if the file is
 * genuinely missing, an empty product is the honest result, and waiting on a
 * HEAD request first would render nothing at all in the meantime.
 */
export function ProductModel({ product, texture, baseColor, autoRotate = false, onMeasure }) {
  const group = useRef();
  const Proxy = PROXY_REGISTRY[product.model.proxy];
  const availability = useModelAvailability(Proxy ? product.model.url : null);

  /*
   * With a proxy available, use it until the GLB is confirmed present —
   * attempting a load we expect to fail throws inside the Canvas. Without a
   * proxy there is nothing to wait for, so those products go straight to their
   * model and the probe is skipped entirely.
   */
  const useProxy = Boolean(Proxy) && availability !== 'available';

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.22;
  });

  // The proxy knows its own size; the GLB path reports its own after fitting.
  useLayoutEffect(() => {
    if (useProxy && Proxy?.radiusM) onMeasure?.(Proxy.radiusM);
  }, [useProxy, Proxy, onMeasure]);

  const proxyContent = Proxy ? (
    <Proxy
      texture={texture}
      material={{ ...product.material, stockColor: baseColor ?? product.print.stockColor }}
    />
  ) : null;

  /*
   * The GLB is attempted optimistically, before the HEAD check has necessarily
   * answered, so a missing or corrupt asset can throw before the probe has had
   * a chance to redirect us to the proxy. The boundary catches that and lands
   * on the same geometry the probe would have chosen — a failed load costs
   * fidelity, never the whole canvas.
   */
  const content = useProxy ? (
    proxyContent
  ) : (
    <GlbLoadBoundary url={product.model.url} fallback={proxyContent}>
      <Suspense fallback={null}>
        <GlbProductModel
          product={product}
          texture={texture}
          baseColor={baseColor}
          onMeasure={onMeasure}
        />
      </Suspense>
    </GlbLoadBoundary>
  );

  return (
    <group
      ref={group}
      scale={product.model.scale ?? 1}
      position={[0, product.model.yOffset ?? 0, 0]}
    >
      {content}
    </group>
  );
}

export default ProductModel;
