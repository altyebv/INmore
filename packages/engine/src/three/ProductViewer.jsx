import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from './Stage';
import ProductModel from './ProductModel';
import resolveCamera from './framing';

/**
 * Aspect at which the framing distance is exactly right.
 *
 * `resolveCamera` works the distance out from the product's bounding sphere
 * against the *vertical* field of view, which is correct as long as height is
 * what the viewport constrains. In a canvas narrower than it is tall — the
 * studio with its controls docked to the side, a phone held upright — width
 * becomes the constraint, and that distance crops the product.
 */
const REFERENCE_ASPECT = 1;

/**
 * Place the camera once the product's real size is known.
 *
 * Runs only when the product, its measured size, or the shape of the canvas
 * changes — never while the visitor is orbiting, which would fight them for
 * control of the view.
 */
function CameraRig({ camera, productId }) {
  const set = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const aspect = useThree((state) => state.viewport.aspect);

  const pull = aspect < REFERENCE_ASPECT ? REFERENCE_ASPECT / aspect : 1;

  useEffect(() => {
    set.position.set(
      camera.position[0] * pull,
      camera.position[1] * pull,
      camera.position[2] * pull
    );
    set.fov = camera.fov;
    set.updateProjectionMatrix();
    if (controls) {
      controls.target.set(...camera.target);
      controls.minDistance = camera.minDistance;
      // Standing back for a narrow canvas must not be undone by a max distance
      // worked out for a wide one.
      controls.maxDistance = camera.maxDistance * pull;
      controls.update();
    }
    // `productId` is in the deps so switching products re-frames even when two
    // products happen to measure the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, controls, productId, pull, camera.position[0], camera.position[1], camera.position[2], camera.fov]);

  return null;
}

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
  baseColor,
  autoRotate,
  onInteract,
  className,
  camera: cameraOverride,
}) {
  const handleInteract = useCallback(() => onInteract?.(), [onInteract]);

  const [radius, setRadius] = useState(null);
  useEffect(() => setRadius(null), [product.id]);

  const camera = useMemo(
    () => resolveCamera(product, cameraOverride, radius),
    [product, cameraOverride, radius]
  );

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
        <ProductModel
          product={product}
          texture={texture}
          baseColor={baseColor}
          autoRotate={autoRotate}
          onMeasure={setRadius}
        />
        <Stage camera={camera} autoRotate={false} onInteract={handleInteract} />
        <CameraRig camera={camera} productId={product.id} />
      </Suspense>
    </Canvas>
  );
}

export default ProductViewer;
