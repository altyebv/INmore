import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Render an approved product model and route the artwork texture onto its
 * printable surface.
 *
 * The GLB is expected to contain a mesh named `model.printMeshName` whose UVs
 * cover the flat, unrolled print area. Every other mesh is left untouched, so
 * lids, handles, seams and inner surfaces keep the materials they were
 * authored with.
 */
export function GlbProductModel({ product, texture, baseColor }) {
  const { scene } = useGLTF(product.model.url);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    cloned.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const isPrintSurface =
        child.name === product.model.printMeshName ||
        child.material?.name === product.model.printMeshName;

      const material = child.material.clone();

      if (isPrintSurface && texture) {
        material.map = texture;
        material.color = new THREE.Color('#ffffff');
        material.roughness = product.material.roughness ?? material.roughness;
        material.metalness = product.material.metalness ?? 0;
        material.envMapIntensity = product.material.envMapIntensity ?? 1;
      } else if (!isPrintSurface && baseColor) {
        // Non-print meshes (base, lid, handles…) pick up the stock colour.
        material.color = new THREE.Color(baseColor);
      } else if (isPrintSurface && !texture && baseColor) {
        material.color = new THREE.Color(baseColor);
      }

      material.needsUpdate = true;
      child.material = material;
    });
  }, [cloned, texture, baseColor, product]);

  return <primitive object={cloned} />;
}

export default GlbProductModel;
