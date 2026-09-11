import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ProductModel,
  Stage,
  preloadProductModel,
  resolveCamera,
} from '@inmore/engine';

/**
 * The hero's product chain.
 *
 * Products hand over to one another: the one on stage turns slowly, then
 * travels out while the next arrives from the opposite side. Only two are
 * mounted at any moment — the one leaving and the one arriving — so the home
 * page never carries four models' worth of geometry at once.
 *
 * The motion is doing a job. A production company's range is the argument, and
 * a still photograph of one cup does not make it; watching a cup become a bag
 * become a box does, in the time it takes to read the headline.
 */

/** How far a product travels either side of centre, in its own radii. */
const TRAVEL = 2.4;

function Slot({ product, baseColor, offset, progress, direction, radius, onMeasure }) {
  const group = useRef();
  const span = (radius ?? 0.1) * TRAVEL;

  useFrame((state, delta) => {
    if (!group.current) return;

    /*
     * `progress` runs 0 → 1 across one handover. The arriving product carries
     * offset -1, so it travels from off-stage (-1) to centre (0); the leaving
     * product carries 0, so it travels from centre (0) to off-stage (+1).
     */
    const t = THREE.MathUtils.clamp(progress + offset, -1, 1);
    // Ease so products accelerate away and settle gently into centre.
    const eased = t === 0 ? 0 : Math.sign(t) * (1 - (1 - Math.abs(t)) ** 3);

    group.current.position.x = eased * span * direction;
    group.current.position.y = Math.abs(eased) * -(radius ?? 0.1) * 0.5;

    const settle = 1 - Math.abs(eased) * 0.35;
    group.current.scale.setScalar(settle);

    group.current.rotation.y += delta * 0.28;
    group.current.rotation.z = eased * -0.12 * direction;
  });

  return (
    <group ref={group}>
      <ProductModel
        product={product}
        texture={null}
        baseColor={baseColor}
        onMeasure={onMeasure}
      />
    </group>
  );
}

/** Viewing direction and tightness shared by the initial frame and the rig. */
const SHOWCASE_VIEW = { position: [0.42, 0.26, 1], fov: 26, framing: 1.75 };

function ShowcaseCamera({ product, radius }) {
  const camera = useMemo(
    () => resolveCamera(product, SHOWCASE_VIEW, radius),
    [product, radius]
  );

  useFrame(({ camera: cam }) => {
    const target = new THREE.Vector3(...camera.position);
    // Ease rather than jump, so a size change between products reads as the
    // camera stepping back rather than the product popping.
    cam.position.lerp(target, 0.12);
    cam.lookAt(0, 0, 0);
    if (Math.abs(cam.fov - camera.fov) > 0.01) {
      cam.fov = camera.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * The one-at-a-time product chain.
 *
 * No longer wired up — the hero now shows the whole range at once on a rail
 * (`three/HeroRail.jsx`). Kept because it is a complete, working alternative
 * and choosing between them is a taste decision, not a technical one: point
 * `HeroShowcase` at this instead and it works.
 */
export function ShowcaseScene({ current, previous, next, progress, direction, className }) {
  const [radius, setRadius] = useState(null);

  const initialCamera = useMemo(() => {
    const { position, fov } = resolveCamera(current.product, SHOWCASE_VIEW);
    return { position, fov };
    // Only the first product matters here; the rig handles every change after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Warm the *next* model while the current one is still on stage. Without
   * this, a product that has not finished downloading arrives as an empty
   * space, and the chain looks broken rather than paced.
   */
  useEffect(() => {
    preloadProductModel(next?.model?.url);
  }, [next]);

  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      /* Start where the first product will be framed, so the rig has almost
         nothing to ease and the hero does not open on a zoom. */
      camera={{ ...initialCamera, near: 0.01, far: 20 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Suspense fallback={null}>
        {previous && (
          <Slot
            key={`${previous.product.id}-out`}
            product={previous.product}
            baseColor={previous.color}
            offset={0}
            progress={progress}
            direction={direction}
            radius={radius}
          />
        )}

        <Slot
          key={`${current.product.id}-in`}
          product={current.product}
          baseColor={current.color}
          offset={-1}
          progress={progress}
          direction={direction}
          radius={radius}
          onMeasure={setRadius}
        />

        <Stage
          camera={{ target: [0, 0, 0] }}
          autoRotate={false}
          controls={false}
          ground={(radius ?? 0.1) * 0.62}
        />
        <ShowcaseCamera product={current.product} radius={radius} />
      </Suspense>
    </Canvas>
  );
}

export default ShowcaseScene;
