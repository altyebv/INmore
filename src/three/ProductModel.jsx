import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PROXY_REGISTRY } from './models/PaperCupProxy';
import GlbProductModel from './models/GlbProductModel';
import useModelAvailability from './models/useModelAvailability';

/**
 * Resolve a product configuration into geometry.
 *
 * Presentation code never asks "is there a GLB yet?" — it asks for a product
 * and gets the best available representation of it.
 */
export function ProductModel({ product, texture, autoRotate = false }) {
  const group = useRef();
  const availability = useModelAvailability(product.model.url);
  const Proxy = PROXY_REGISTRY[product.model.proxy];

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.22;
  });

  const content =
    availability === 'available' ? (
      <Suspense fallback={Proxy ? <Proxy texture={texture} material={product.material} /> : null}>
        <GlbProductModel product={product} texture={texture} />
      </Suspense>
    ) : Proxy ? (
      <Proxy
        texture={texture}
        material={{ ...product.material, stockColor: product.print.stockColor }}
      />
    ) : null;

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
