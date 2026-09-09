import { Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from './Stage';
import ProductModel from './ProductModel';

/**
 * The rendering boundary.
 *
 * Everything below this component lives in the three.js world; everything
 * above it is regular DOM. Studio state arrives as props, and the only thing
 * that leaves is an `onInteract` signal so the UI can stop auto-rotating once
 * the visitor takes over.
 */
export function ProductViewer({
  product,
  texture,
  autoRotate,
  onInteract,
  className,
  camera: cameraOverride,
}) {
  const handleInteract = useCallback(() => onInteract?.(), [onInteract]);
  const camera = { ...product.camera, ...cameraOverride };

  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: camera.position, fov: camera.fov, near: 0.01, far: 20 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Suspense fallback={null}>
        <ProductModel product={product} texture={texture} autoRotate={autoRotate} />
        <Stage camera={camera} autoRotate={false} onInteract={handleInteract} />
      </Suspense>
    </Canvas>
  );
}

export default ProductViewer;
