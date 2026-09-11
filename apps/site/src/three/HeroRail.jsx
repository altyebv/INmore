import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import ProductModel from './ProductModel';
import { paletteFor } from '@/products';

/**
 * The hero rail — every product, at once, on a curved track.
 *
 * ## The idea
 *
 * The hero used to show one product at a time and cross-fade between them,
 * which meant the page's opening statement was a single object on a dark
 * field, and the range was something you had to wait to discover. Putting the
 * whole catalogue on one curved rail says it immediately: this is what we
 * make, and one of them is in focus because you are looking at it.
 *
 * ## How depth is done
 *
 * Nothing here dims a product by hand. The rail is a real arc in space and the
 * scene is genuinely foggy, so the products towards the edges are further from
 * the camera and the fog takes them — smaller, softer, darker, the way distance
 * actually works. The centre product is lit by a spot the others are outside
 * of. The result reads as depth rather than as opacity, and it costs one fog
 * declaration instead of a per-material animation.
 *
 * ## Why the rail has twice as many slots as there are products
 *
 * A rail wide enough to fill the frame needs about seven visible objects; the
 * catalogue has four. So the rail carries two full cycles, and a product's two
 * copies sit four slots apart — far enough that the frame never contains both.
 * Slots fade out entirely before the wrap point, which is what makes the loop
 * seamless: an object does not pop from one end to the other, it recedes to
 * nothing at one edge while its counterpart grows out of nothing at the other.
 *
 * The alternative, remounting each slot's product as the rail turns, would
 * rebuild geometry and materials on every step. Here every product mounts once
 * and only its transform changes.
 */

/** Slots on the rail. Two full cycles of a four-product catalogue. */
const CYCLES = 2;

/**
 * The arc, at two shapes.
 *
 * A single set of numbers cannot serve both a 16:9 desktop window and a phone
 * held upright: the same arc that puts three products either side of centre on
 * a wide screen pushes the first neighbour clean off a portrait one. So the
 * rail has two geometries and picks by aspect ratio — a wide, shallow arc that
 * fills the width, and a tight one where the neighbours sit at the edges of the
 * frame and the centred product keeps its presence.
 *
 * `angle` is the gap between slots in radians, `radius` the arc's radius (small
 * radius, fast recession), `facing` how far each slot turns towards the camera
 * (0 parallel, 1 fully), `lean` its outward tilt, and `fadeFrom` the offset at
 * which a slot starts shrinking away so the loop's wrap point is never seen.
 */
const LAYOUTS = {
  /**
   * The rail stays centred in the viewport at both shapes, because the readout
   * beneath it is centred too and a rail that does not sit under its own label
   * reads as a mistake. What changes with shape is the framing: `cameraZ` how
   * far back the camera stands, and `lookAtY` how far down the frame the rail
   * sits — on a phone the copy takes the upper half, so the products move into
   * the lower one rather than being read through the headline.
   */
  wide: { angle: 0.46, radius: 0.75, facing: 0.55, lean: 0.05, fadeFrom: 2.4, cameraZ: 1.45, lookAtY: 0.02 },
  narrow: { angle: 0.5, radius: 0.5, facing: 0.75, lean: 0.04, fadeFrom: 1.7, cameraZ: 1.72, lookAtY: 0.15 },
};

/** Below this width-to-height ratio the rail uses its tight geometry. */
const NARROW_ASPECT = 1.15;

/** Pick the arc that suits the viewport. Exported so the camera agrees with it. */
export function railLayout(aspect) {
  return aspect < NARROW_ASPECT ? LAYOUTS.narrow : LAYOUTS.wide;
}

/** Height in world metres a typical product occupies on the rail. */
const STAGE_HEIGHT = 0.28;

/**
 * How much of each product's real relative size survives presentation.
 *
 * At 0 every product is framed to the same height, which is tidy and tells the
 * visitor nothing. At 1 the cup is a quarter the height of the bag and reads as
 * an afterthought. In between, a cup still looks like a cup next to a bag.
 */
const SIZE_BLEND = 0.3;

/** The floor sits below the products; they float over their own reflection. */
const FLOOR_Y = -0.3;

const BACKGROUND = '#0b0b0a';

/**
 * Per-product scale, blending real size towards a common presentation height.
 * Computed against the geometric mean so no single outlier product drags the
 * whole rail's scale with it.
 */
function useRailScales(products) {
  return useMemo(() => {
    const heights = products.map((p) => p.model.heightM || STAGE_HEIGHT);
    const reference = Math.exp(heights.reduce((sum, h) => sum + Math.log(h), 0) / heights.length);
    return heights.map((height) => {
      const presented = STAGE_HEIGHT * (1 - SIZE_BLEND + SIZE_BLEND * (height / reference));
      return presented / height;
    });
  }, [products]);
}

/** Smooth 0→1 ramp, used to retire a slot before it reaches the wrap point. */
function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * One product on the rail.
 *
 * Two nested groups on purpose: the outer one is the slot — where on the arc
 * this product currently sits and how it is turned to face the camera — and the
 * inner one is the product's own slow rotation, which only runs while it is the
 * one being looked at. Combining them into a single group would mean the spin
 * fought the arc's facing angle every frame.
 */
function RailSlot({
  product,
  index,
  slotCount,
  scale,
  stockColor,
  progressRef,
  onSelect,
  reducedMotion,
  layout,
}) {
  const slot = useRef();
  const spinner = useRef();
  const spin = useRef(0);
  const focus = useRef(0);

  useFrame((state, delta) => {
    if (!slot.current) return;

    // Signed distance from centre, wrapped into (-slotCount/2, slotCount/2].
    const half = slotCount / 2;
    let offset = ((index - progressRef.current + half) % slotCount + slotCount) % slotCount - half;

    const angle = offset * layout.angle;
    const presence = 1 - smoothstep(layout.fadeFrom, half, Math.abs(offset));

    slot.current.position.set(
      Math.sin(angle) * layout.radius,
      0,
      (Math.cos(angle) - 1) * layout.radius
    );
    slot.current.rotation.set(0, -angle * layout.facing, offset * layout.lean);
    // Presence folds into scale rather than opacity: a product that shrinks to
    // nothing at the edge of the arc reads as distance, and needs no
    // transparent materials or sort order to do it.
    slot.current.scale.setScalar(scale * presence);
    slot.current.visible = presence > 0.01;

    // How centred this product is, eased — drives the float and the spin, so
    // both arrive with the product rather than switching on at the last moment.
    const centred = 1 - THREE.MathUtils.clamp(Math.abs(offset), 0, 1);
    focus.current = THREE.MathUtils.damp(focus.current, centred, 6, delta);

    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      slot.current.position.y =
        Math.sin(t * 0.9 + index * 1.7) * 0.006 + focus.current * 0.012;
      spin.current += delta * 0.32 * focus.current;
      if (spinner.current) spinner.current.rotation.y = spin.current;
    }
  });

  return (
    <group
      ref={slot}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <group ref={spinner}>
        {/* No texture: the rail shows stock, not artwork. The stock colour is
            the product's own, so a bag arrives in kraft and a box in board —
            the range reads as a range rather than four white shapes. */}
        <ProductModel product={product} texture={null} baseColor={stockColor} />
      </group>
    </group>
  );
}

/**
 * Eases the rail towards the selected slot, and reports where it actually is.
 *
 * The reporting matters as much as the easing: the DOM below the canvas names
 * the product in the middle, and "in the middle" is a fact about the rail's
 * current position, not about where it has been told to go. Rounding the
 * position flips at the halfway point between two products, which is the moment
 * the eye agrees the subject has changed.
 */
function RailDriver({ targetRef, progressRef, onCentreChange, reducedMotion }) {
  const reported = useRef(null);

  useFrame((_, delta) => {
    progressRef.current = reducedMotion
      ? targetRef.current
      : THREE.MathUtils.damp(progressRef.current, targetRef.current, 4.2, delta);

    const centre = Math.round(progressRef.current);
    if (centre !== reported.current) {
      reported.current = centre;
      onCentreChange?.(centre);
    }
  });

  return null;
}

/**
 * The light that makes the centre of the rail the subject.
 *
 * A spot needs a target object that lives in the scene graph, not just a
 * position — three.js reads the target's world matrix, and an object outside
 * the graph never gets one updated.
 */
function CentreSpot() {
  const target = useRef();
  const light = useRef();

  // three.js reads the target's *world* matrix, so the target has to be a real
  // node in the graph. Rendering it as a sibling inside the rail group means it
  // travels with the rail for free.
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  return (
    <>
      <object3D ref={target} position={[0, 0, 0]} />
      <spotLight
        ref={light}
        position={[0.15, 0.75, 0.85]}
        /* Narrow enough that the cone falls off before the first neighbour:
           the product in the middle is lit, the ones beside it are lit by the
           room. */
        angle={0.32}
        penumbra={0.95}
        intensity={8.5}
        distance={3}
        decay={1.5}
        color="#fff6ea"
      />
    </>
  );
}

export function HeroRail({
  products,
  targetRef,
  progressRef,
  onSelect,
  onCentreChange,
  reducedMotion = false,
  reflections = true,
}) {
  const scales = useRailScales(products);
  const slotCount = products.length * CYCLES;
  const aspect = useThree((state) => state.viewport.aspect);
  const layout = railLayout(aspect);

  const slots = useMemo(
    () =>
      Array.from({ length: slotCount }, (_, index) => {
        const productIndex = index % products.length;
        const product = products[productIndex];
        const palette = paletteFor(product);
        return {
          index,
          product,
          scale: scales[productIndex],
          /*
           * Each product appears twice on the rail, and its two copies take
           * different stocks from its own palette. They sit four slots apart so
           * the frame never holds both — so the rail shows the range of boards
           * as well as the range of products, and the far edge never reads as
           * the same object twice.
           *
           * The copies are spread *across* the palette rather than taking its
           * first two entries. Palettes are written light-to-dark, so the first
           * two are the two palest and picking them made a rail of four
           * near-white objects — the products were all there and the range was
           * invisible.
           */
          stockColor:
            palette[
              (Math.floor(index / products.length) * Math.ceil(palette.length / CYCLES)) %
                palette.length
            ].color,
        };
      }),
    [products, scales, slotCount]
  );

  return (
    <>
      {/* Distance is what dims the rail. `near` sits just in front of the centre
          slot so the focused product is never touched by the fog, and `far` is
          tight enough that the first neighbour is already noticeably cooler and
          the third has almost gone. This, not a per-material tweak, is what
          makes the focused product the subject. */}
      <fog attach="fog" args={[BACKGROUND, 1.46, 2.0]} />

      {/* Enough ambient that a dark stock still reads as a shape rather than a
          hole. The products here are flat board colours, not textured surfaces
          with their own value range, so they need less key and more fill than a
          photographic model would. */}
      <ambientLight intensity={0.34} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 1.4, 1.2]} scale={[4, 2, 1]} />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[-2, 0.6, -0.4]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[3, 2, 1]}
          color="#cfd9e6"
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          position={[2, 0.4, -0.2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[3, 2, 1]}
          color="#ffeeda"
        />
      </Environment>

      <RailDriver
        targetRef={targetRef}
        progressRef={progressRef}
        onCentreChange={onCentreChange}
        reducedMotion={reducedMotion}
      />

      {/* Everything that belongs to the rail moves with it — including the
          lights, so the spot stays on whichever product is centred rather than
          on whatever happens to be at the origin. */}
      <group>
        {/* Kept low. A strong general light flattens the rail — every product
            reads equally lit and the fog has nothing to work against. The
            centre spot below does the modelling. */}
        <directionalLight position={[0.4, 0.9, 1.1]} intensity={0.7} />
        <directionalLight position={[-1.2, 0.4, -0.5]} intensity={0.3} color="#b9c6d6" />
        <CentreSpot />

        {slots.map((slot) => (
          <RailSlot
            key={slot.index}
            {...slot}
            slotCount={slotCount}
            progressRef={progressRef}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
            layout={layout}
          />
        ))}
      </group>

      {/* A pool of light on the floor under the focused product. Without it the
          floor is a correct, invisible, black plane: the reflection has nothing
          to reflect off and the products float in a void. This is what puts a
          stage under them. */}
      <spotLight
        position={[0, 0.55, 0.42]}
        angle={0.85}
        penumbra={1}
        intensity={4.5}
        distance={3.4}
        decay={1.4}
        color="#f0e6dc"
      />

      {/* The floor. Products float above it, so what grounds them is their own
          reflection rather than a contact shadow they never touch.

          A reflection is a second render of the scene every frame, and the blur
          that softens it is several more passes on top. Those numbers are
          therefore chosen for cost, not for fidelity: the reflection is heavily
          blurred and only half-strength, so it reads as a sheen on a dark floor
          — which is all it needs to do — and a device that cannot afford even
          that gets the plain floor instead. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]}>
        <planeGeometry args={[12, 12]} />
        {reflections ? (
          <MeshReflectorMaterial
            resolution={256}
            mixBlur={0.85}
            mixStrength={9}
            blur={[150, 50]}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.35}
            mirror={0.6}
            color="#1c1c1a"
            metalness={0.5}
            roughness={0.9}
          />
        ) : (
          <meshStandardMaterial color="#1c1c1a" roughness={0.9} metalness={0.2} />
        )}
      </mesh>
    </>
  );
}

export { BACKGROUND as RAIL_BACKGROUND };
export default HeroRail;
