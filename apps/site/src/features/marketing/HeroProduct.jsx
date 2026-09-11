import { Suspense, lazy } from 'react';

/**
 * The hero object.
 *
 * The 3D bundle is loaded lazily so first paint is text, not a renderer. Until
 * it arrives the hero shows a still, calm surface rather than a spinner.
 */
const ProductViewer = lazy(() => import('@/three/ProductViewer'));

/** Slightly wider framing than the studio: the hero shows the whole object. */
const HERO_CAMERA = { position: [0.5, 0.28, 1], fov: 26, framing: 1.95 };

export function HeroProduct({ product, className, autoRotate = true }) {
  if (!product) return <div className={className} />;

  return (
    <div className={className}>
      <Suspense fallback={null}>
        <ProductViewer
          product={product}
          texture={null}
          autoRotate={autoRotate}
          camera={HERO_CAMERA}
        />
      </Suspense>
    </div>
  );
}

export default HeroProduct;
