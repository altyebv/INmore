import { Suspense, useRef } from 'react';
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
 * Resolution strategy:
 * 1. If the GLB URL exists we *always* attempt it (even while the HEAD check
 *    is still in flight). `useGLTF` will throw a promise that the Suspense
 *    boundary catches, and when it resolves the model appears.
 * 2. While the GLB is downloading the Suspense fallback shows the proxy (if
 *    one is registered). If there is no proxy the fallback is `null` — this
 *    is fine for the three GLB-only products whose files ship with the build.
 * 3. If the HEAD check ultimately reports `'missing'`, we fall back to the
 *    proxy permanently.
 *
 * Callers that need to know *when* a product's final representation has been
 * decided (rather than just rendering whatever's current) can await
 * `whenProductReady` from `./models/productReadiness`, which mirrors this
 * same branching.
 */
export function ProductModel({ product, texture, baseColor, autoRotate = false }) {
  const group = useRef();
  const availability = useModelAvailability(product.model.url);
  const Proxy = PROXY_REGISTRY[product.model.proxy];

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.22;
  });

  const stockColor = baseColor ?? product.print.stockColor;
  const proxyNode = Proxy ? (
    <Proxy texture={texture} material={{ ...product.material, stockColor }} />
  ) : null;

  // When the model is confirmed missing, only the proxy can help.
  // Otherwise (checking *or* available) we optimistically try the GLB.
  const content =
    availability === 'missing' ? (
      proxyNode
    ) : (
      // GlbLoadBoundary is the safety net for the optimistic attempt above:
      // if the GLB 404s or fails to parse before the HEAD check catches up,
      // this catches the thrown error and falls back to the proxy instead of
      // taking the canvas down with it.
      <GlbLoadBoundary url={product.model.url} fallback={proxyNode}>
        <Suspense fallback={proxyNode}>
          <GlbProductModel product={product} texture={texture} baseColor={stockColor} />
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
