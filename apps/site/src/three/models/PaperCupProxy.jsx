import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Paper cup built from parametric geometry.
 *
 * This stands in for the approved GLB and implements the same contract: a
 * single printable body surface whose UV space runs 0–1 horizontally around
 * the cup and 0–1 vertically from base to rim. When `public/models/paper-cup.glb`
 * is added, `ProductModel` uses it instead and nothing else changes.
 *
 * Dimensions are a real 8 oz cup in metres.
 */

const DIMENSIONS = {
  topRadius: 0.0405,
  bottomRadius: 0.0285,
  height: 0.093,
  rimTube: 0.0028,
  baseInset: 0.004,
  wallSegments: 128,
};

export function PaperCupProxy({ texture, material = {}, stockColor, ...props }) {
  const { topRadius, bottomRadius, height, rimTube, baseInset, wallSegments } = DIMENSIONS;

  const bodyGeometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        topRadius,
        bottomRadius,
        height,
        wallSegments,
        1,
        true // open ended — the print surface is the wall only
      ),
    [topRadius, bottomRadius, height, wallSegments]
  );

  const interiorGeometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        topRadius * 0.985,
        bottomRadius * 0.985,
        height * 0.995,
        wallSegments,
        1,
        true
      ),
    [topRadius, bottomRadius, height, wallSegments]
  );

  const baseGeometry = useMemo(
    () => new THREE.CircleGeometry(bottomRadius * 0.94, wallSegments),
    [bottomRadius, wallSegments]
  );

  const rimGeometry = useMemo(
    () => new THREE.TorusGeometry(topRadius + rimTube * 0.35, rimTube, 16, wallSegments),
    [topRadius, rimTube, wallSegments]
  );

  const stock = stockColor ?? material.stockColor ?? '#f7f5f1';

  return (
    <group {...props}>
      {/* Printable wall */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={texture}
          /* With artwork the texture carries the colour; without it the body
             is bare stock like the rest of the cup. */
          color={texture ? '#ffffff' : stock}
          roughness={material.roughness ?? 0.62}
          metalness={material.metalness ?? 0}
          envMapIntensity={material.envMapIntensity ?? 0.8}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Inner wall — unprinted stock, seen when the cup tilts */}
      <mesh geometry={interiorGeometry}>
        <meshStandardMaterial
          color={stock}
          roughness={0.85}
          metalness={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Base */}
      <mesh
        geometry={baseGeometry}
        position={[0, -height / 2 + baseInset, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color={stock} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Rolled rim */}
      <mesh
        geometry={rimGeometry}
        position={[0, height / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color={stock} roughness={0.55} metalness={0} />
      </mesh>
    </group>
  );
}

/** Half the diagonal of the cup's bounding box, for camera framing. */
PaperCupProxy.radiusM = Math.hypot(DIMENSIONS.topRadius * 2, DIMENSIONS.height) / 2;

export const PROXY_REGISTRY = {
  'paper-cup-proxy': PaperCupProxy,
};

export default PaperCupProxy;
