import { Suspense, lazy } from 'react';
import { paperCup } from '@/products';

/**
 * The hero object.
 *
 * The 3D bundle is loaded lazily so first paint is text, not a renderer. Until
 * it arrives the hero shows a still, calm surface rather than a spinner.
 */
const ProductViewer = lazy(() => import('@/three/ProductViewer'));

/** Slightly wider framing than the studio: the hero shows the whole object. */
const HERO_CAMERA = { position: [0.19, 0.1, 0.36], fov: 26 };

export function HeroProduct({ className, autoRotate = true }) {
  return (
    <div className={className}>
      <Suspense fallback={null}>
        <ProductViewer
          product={paperCup}
          texture={null}
          autoRotate={autoRotate}
          camera={HERO_CAMERA}
        />
      </Suspense>
    </div>
  );
}

export default HeroProduct;
