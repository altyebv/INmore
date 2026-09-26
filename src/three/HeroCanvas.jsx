import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import HeroRail, { RAIL_BACKGROUND, railLayout } from './HeroRail';

/**
 * The WebGL boundary for the hero.
 *
 * `ProductViewer` is the studio's seam — one product, orbit controls, a texture
 * to place. The hero needs the opposite: many products, no controls, and a
 * camera that never moves. Rather than growing one component two personalities,
 * they are two seams over the same `ProductModel` underneath.
 *
 * The camera is deliberately fixed. Everything that moves on the rail moves in
 * world space, so the composition — where the headline sits relative to the
 * products, where the reflection falls — is the same on every frame and at
 * every viewport, instead of drifting with an orbit control the visitor never
 * asked to use.
 */

/**
 * Holds the camera at the distance the current arc was designed around.
 *
 * The rail changes shape with the viewport (see `railLayout`), and an arc drawn
 * for a phone viewed from a desktop distance is just a smaller arc. Reading the
 * distance from the same function that shapes the rail keeps the two from
 * drifting apart.
 */
function Framing() {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.viewport.aspect);
  const { cameraZ, lookAtY } = railLayout(aspect);

  useEffect(() => {
    // Slightly above the products and angled down, so the floor — and the
    // reflection the products stand on — is inside the frame. Raising the point
    // it looks at pushes the rail lower down the frame, which is how the phone
    // layout keeps the products clear of the copy above them.
    camera.position.set(0, 0.1, cameraZ);
    camera.lookAt(0, lookAtY, 0);
    camera.updateProjectionMatrix();
  }, [camera, cameraZ, lookAtY]);

  return null;
}

export function HeroCanvas({
  products,
  targetRef,
  progressRef,
  onSelect,
  onCentreChange,
  reducedMotion,
  dpr,
  reflections,
}) {
  return (
    <Canvas
      dpr={dpr ?? [1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0.1, 1.45], fov: 30, near: 0.05, far: 12 }}
      onCreated={({ gl, scene }) => {
        gl.toneMappingExposure = 0.95;
        // The fog only reads as depth if it matches what is behind it.
        scene.background = new THREE.Color(RAIL_BACKGROUND);
      }}
    >
      <Suspense fallback={null}>
        <Framing />
        <HeroRail
          products={products}
          targetRef={targetRef}
          progressRef={progressRef}
          onSelect={onSelect}
          onCentreChange={onCentreChange}
          reducedMotion={reducedMotion}
          reflections={reflections}
        />
      </Suspense>
    </Canvas>
  );
}

export default HeroCanvas;
