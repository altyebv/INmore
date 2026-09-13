import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import useProductGLTF from './loader';
import buildDecalGeometry from '../printSurface';

/**
 * Render an approved product model, size it to its real dimensions, and put
 * the artwork on the right panel.
 *
 * Three jobs, in order:
 *
 * 1. **Fit.** Models arrive at whatever scale their author used — one of ours
 *    is 11 units tall, another 1.5. The config declares the product's real
 *    height in metres and the model is scaled and centred to match, so the
 *    camera, lighting and shadows are shared across every product without
 *    per-model magic numbers.
 *
 * 2. **Stock.** Meshes that are not the print surface take the selected base
 *    colour, tinted so the model's own shading survives.
 *
 * 3. **Print.** Either the artwork texture is applied to the mesh's authored
 *    UVs, or — for models whose UV atlas is not a print layout — a projected
 *    decal is generated and laid over the panel. See `printSurface.js`.
 */
export function GlbProductModel({ url, product, texture, baseColor, onMeasure }) {
  const { scene } = useProductGLTF(url ?? product.model.url);
  const groupRef = useRef();

  // Clone so two viewers (hero and studio) never fight over one scene graph.
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
      // Centre horizontally, and sit the product on the ground plane.
      fitOffset: new THREE.Vector3(
        -centre.x * scale,
        -box.min.y * scale - target / 2,
        -centre.z * scale
      ),
    };
  }, [cloned, product.model.heightM]);

  // Tell the viewer how big this product ended up, so it can frame it.
  useLayoutEffect(() => {
    onMeasure?.(fitRadius);
  }, [onMeasure, fitRadius]);

  const printMeshName = product.model.printMeshName;
  const printMode = product.print.mode ?? 'texture';

  const matches = (child) =>
    child.name === printMeshName || child.material?.name === printMeshName;

  const named = (child, list) =>
    Boolean(list?.some((name) => child.name === name || child.material?.name === name));

  /*
   * A `printMeshName` that matches nothing used to fail silently: no mesh
   * takes the texture, no decal geometry is built, and the product renders
   * with no print surface at all — the kind of thing that is obvious on
   * screen but invisible in the console. Worth knowing while a product is
   * being onboarded, and worth nothing to a visitor.
   */
  useLayoutEffect(() => {
    if (!import.meta.env.DEV) return;

    let found = false;
    const names = new Set();
    cloned.traverse((child) => {
      if (!child.isMesh) return;
      if (child.name) names.add(child.name);
      if (child.material?.name) names.add(child.material.name);
      if (matches(child)) found = true;
    });

    if (!found) {
      console.warn(
        `[${product.id}] print.printMeshName is "${printMeshName}", but no mesh or ` +
          `material in the model is named that. Found: ${
            names.size ? [...names].join(', ') : '(nothing named)'
          }.`
      );
    }
  }, [cloned, printMeshName, product.id]);

  /* --- Base pass: stock colour and shadows -------------------------------- */
  useLayoutEffect(() => {
    const stock = new THREE.Color(baseColor ?? product.print.stockColor);

    cloned.traverse((child) => {
      if (!child.isMesh) return;

      // Parts of a model that are a finishing option rather than the product —
      // a ribbon, a sleeve, a window patch — are hidden unless the product
      // config asks for them. Leaving them in would cover the print area.
      if (named(child, product.model.hiddenMeshes)) {
        child.visible = false;
        return;
      }
      child.visible = true;

      child.castShadow = true;
      child.receiveShadow = true;

      if (!child.userData.inmoreOriginal) {
        child.userData.inmoreOriginal = child.material;
        child.material = child.material.clone();
      }

      const material = child.material;
      const isPrintSurface = matches(child);

      if (printMode === 'texture' && isPrintSurface) {
        material.map = texture ?? null;
        material.color = new THREE.Color('#ffffff');
      } else if (product.model.stockMeshes?.length) {
        // Only the named meshes take the stock colour; everything else — a
        // ribbon, a handle, a window — keeps the look it was authored with.
        const tinted = product.model.stockMeshes.some(
          (name) => child.name === name || child.material?.name === name
        );
        if (tinted) {
          material.map = null;
          material.color = stock;
        }
      } else {
        material.map = null;
        material.color = stock;
      }

      material.roughness = product.material.roughness ?? material.roughness;
      material.metalness = product.material.metalness ?? 0;
      material.envMapIntensity = product.material.envMapIntensity ?? 1;
      material.needsUpdate = true;
    });
  }, [cloned, texture, baseColor, product, printMode]);

  /* --- Decal pass --------------------------------------------------------- */
  const decal = useMemo(() => {
    if (printMode !== 'decal') return null;

    cloned.updateWorldMatrix(true, true);

    const geometries = [];
    cloned.traverse((child) => {
      if (!child.isMesh || !matches(child)) return;
      const projection = product.print.projection ?? {};
      const { widthMm, heightMm } = product.print.physical;
      const geometry = buildDecalGeometry(
        child,
        {
          ...projection,
          // 0.4 mm off the surface, converted into this model's own units.
          liftUnits: ((projection.liftMm ?? 0.4) / 1000) / fitScale,
          // The shape the artwork was composed at. The config is the authority
          // on what the panel is; the mesh only says where it is.
          targetAspect: widthMm / heightMm,
        },
        child.matrixWorld
      );
      if (geometry) geometries.push(geometry);
    });

    if (!geometries.length) return null;
    // One panel per product keeps this simple; merging is not worth the
    // dependency for the handful of triangles involved.
    return geometries[0];
  }, [cloned, printMode, product, fitScale]);

  /*
   * A decal panel has no dieline, so its millimetres are entered by hand and
   * nothing checks them. The projection measures the panel the mesh actually
   * has; if that disagrees with what the config claims, the artwork is
   * letterboxed to stay undistorted — correct, but a sign the config is
   * describing a different object than the model is.
   *
   * Worth knowing while a product is being onboarded, and worth nothing to a
   * visitor, so it is a development warning and not a runtime concern.
   */
  useLayoutEffect(() => {
    if (!import.meta.env.DEV || !decal) return;

    const measured = decal.userData.panelAspect;
    const { widthMm, heightMm } = product.print.physical;
    const declared = widthMm / heightMm;
    if (!measured || !declared) return;

    const drift = Math.abs(measured / declared - 1);
    if (drift > 0.02) {
      console.warn(
        `[${product.id}] print.physical says ${widthMm}×${heightMm} mm ` +
          `(aspect ${declared.toFixed(3)}), but the projected panel measures ` +
          `${measured.toFixed(3)} — ${(drift * 100).toFixed(0)}% out. Artwork is ` +
          `letterboxed to stay undistorted; correct the millimetres, or the ` +
          `projection axis and threshold, to use the whole panel.`
      );
    }
  }, [decal, product]);

  useLayoutEffect(() => () => decal?.dispose(), [decal]);

  return (
    <group ref={groupRef} scale={fitScale} position={[0, 0, 0]}>
      <group position={fitOffset.clone().divideScalar(fitScale)}>
        <primitive object={cloned} />
        {decal && texture && (
          <mesh geometry={decal} renderOrder={2}>
            <meshStandardMaterial
              map={texture}
              transparent
              alphaTest={0.01}
              roughness={product.material.roughness ?? 0.6}
              metalness={0}
              envMapIntensity={product.material.envMapIntensity ?? 1}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              side={THREE.FrontSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

export default GlbProductModel;
