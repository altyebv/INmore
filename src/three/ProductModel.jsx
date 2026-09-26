import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PROXY_REGISTRY } from './models/PaperCupProxy';

/**
 * A product, drawn for display.
 *
 * The website only ever shows products — it never prints on them — so this is
 * deliberately much smaller than the configurator's model: fit the GLB to its
 * real height, tint the stock meshes, done. A product with no GLB yet falls
 * back to parametric proxy geometry (only the paper cup has one).
 */

export const DRACO_PATH = '/draco/';

const named = (child, list) =>
  Boolean(list?.some((name) => child.name === name || child.material?.name === name));

function GlbModel({ product, baseColor, onMeasure }) {
  const { scene } = useGLTF(product.model.url, DRACO_PATH);
  // Clone so the hero rail and the home-page viewer never share one scene graph.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const { fitScale, fitOffset, fitRadius } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const target = product.model.heightM ?? 0.1;
    const scale = size.y > 0 ? target / size.y : 1;
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    return {
      fitScale: scale,
      fitRadius: sphere.radius * scale,
      fitOffset: new THREE.Vector3(-centre.x, -box.min.y - target / (2 * scale), -centre.z),
    };
  }, [cloned, product.model.heightM]);

  useLayoutEffect(() => {
    onMeasure?.(fitRadius);
  }, [onMeasure, fitRadius]);

  useLayoutEffect(() => {
    const stock = new THREE.Color(baseColor ?? product.palette[0]);
    const { stockMeshes, hiddenMeshes } = product.model;

    cloned.traverse((child) => {
      if (!child.isMesh) return;
      if (named(child, hiddenMeshes)) {
        child.visible = false;
        return;
      }
      child.visible = true;
      child.castShadow = true;
      child.receiveShadow = true;

      if (!child.userData.original) {
        child.userData.original = child.material;
        child.material = child.material.clone();
      }
      const material = child.material;

      if (!stockMeshes?.length || named(child, stockMeshes)) {
        material.map = null;
        material.color = stock;
      }
      material.roughness = product.material.roughness ?? material.roughness;
      material.metalness = product.material.metalness ?? 0;
      material.envMapIntensity = product.material.envMapIntensity ?? 1;
      material.needsUpdate = true;
    });
  }, [cloned, baseColor, product]);

  return (
    <group scale={fitScale}>
      <group position={fitOffset}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

export function ProductModel({ product, baseColor, autoRotate = false, onMeasure }) {
  const group = useRef();
  const Proxy = product.model.url ? null : PROXY_REGISTRY[product.model.proxy];

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.22;
  });

  useLayoutEffect(() => {
    if (Proxy?.radiusM) onMeasure?.(Proxy.radiusM);
  }, [Proxy, onMeasure]);

  return (
    <group ref={group} position={[0, product.model.yOffset ?? 0, 0]}>
      {Proxy ? (
        <Proxy
          texture={null}
          material={{ ...product.material, stockColor: baseColor ?? product.palette[0] }}
        />
      ) : product.model.url ? (
        <GlbModel product={product} baseColor={baseColor} onMeasure={onMeasure} />
      ) : null}
    </group>
  );
}

export default ProductModel;
