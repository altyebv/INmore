import * as THREE from 'three';

/**
 * Turn any product mesh into a printable surface.
 *
 * A model authored for printing carries a flat, unrolled UV layout and needs
 * none of this — its artwork is simply a texture (`printMode: 'texture'`).
 * Models that come from a 3D asset library rarely do: their UV atlas is built
 * for a photographic texture, and often every face of the product shares the
 * same patch of UV space. Painting artwork into that atlas puts the same logo
 * on all six sides of a box.
 *
 * So for those we ignore the authored UVs and build the print surface
 * ourselves (`printMode: 'decal'`): take the triangles that face the panel
 * being printed, project them onto that panel to get honest flat coordinates,
 * and render them as a thin overlay above the product's own material. The
 * product keeps its stock colour underneath, which is also what makes the base
 * colour selectable.
 */

const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

function axisVector(axis) {
  const sign = axis.startsWith('-') ? -1 : 1;
  const key = axis.replace('-', '');
  return AXES[key].clone().multiplyScalar(sign);
}

/**
 * Build decal geometry for one mesh.
 *
 * @param {THREE.Mesh} mesh          Source mesh, already in its final transform.
 * @param {object} projection        Product config `print.projection`.
 * @param {THREE.Matrix4} toLocal    Transform from mesh space into the group we render in.
 * @returns {THREE.BufferGeometry|null}
 */
export function buildDecalGeometry(mesh, projection, toLocal) {
  const source = mesh.geometry;
  const position = source.getAttribute('position');
  if (!position) return null;

  const normalAttr = source.getAttribute('normal');
  const index = source.getIndex();
  const triangleCount = index ? index.count / 3 : position.count / 3;

  const facing = axisVector(projection.axis ?? 'z');
  const up = axisVector(projection.up ?? 'y');
  const right = new THREE.Vector3().crossVectors(up, facing).normalize();
  const trueUp = new THREE.Vector3().crossVectors(facing, right).normalize();

  const threshold = projection.threshold ?? 0.35;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const na = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();

  const positions = [];
  const normals = [];
  const kept = [];

  const readVertex = (i, target) => {
    target.fromBufferAttribute(position, i).applyMatrix4(toLocal);
    return target;
  };

  for (let t = 0; t < triangleCount; t += 1) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    readVertex(i0, a);
    readVertex(i1, b);
    readVertex(i2, c);

    edge1.subVectors(b, a);
    edge2.subVectors(c, a);
    faceNormal.crossVectors(edge1, edge2).normalize();

    // Authored normals are more reliable than winding on imported meshes.
    if (normalAttr) {
      na.fromBufferAttribute(normalAttr, i0)
        .applyMatrix4(toLocal)
        .sub(new THREE.Vector3().setFromMatrixPosition(toLocal))
        .normalize();
      if (na.lengthSq() > 0.1) faceNormal.copy(na);
    }

    if (faceNormal.dot(facing) < threshold) continue;

    kept.push([a.clone(), b.clone(), c.clone()]);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    normals.push(
      faceNormal.x, faceNormal.y, faceNormal.z,
      faceNormal.x, faceNormal.y, faceNormal.z,
      faceNormal.x, faceNormal.y, faceNormal.z
    );
  }

  if (!kept.length) return null;

  // Project the kept triangles onto the panel and normalise to 0–1.
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  const projected = [];

  for (const triangle of kept) {
    for (const point of triangle) {
      const u = point.dot(right);
      const v = point.dot(trueUp);
      projected.push(u, v);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
  }

  const spanU = maxU - minU || 1;
  const spanV = maxV - minV || 1;

  // `inset` keeps artwork off the folded edges of a panel.
  const inset = projection.inset ?? 0;
  const scaleU = 1 / (1 - inset * 2);
  const scaleV = 1 / (1 - inset * 2);

  const uvs = new Float32Array(projected.length);
  for (let i = 0; i < projected.length; i += 2) {
    const u = ((projected[i] - minU) / spanU - 0.5) * scaleU + 0.5;
    const v = ((projected[i + 1] - minV) / spanV - 0.5) * scaleV + 0.5;
    uvs[i] = u;
    // Canvas textures run top-down; the projection runs bottom-up.
    uvs[i + 1] = v;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();

  // Lift the decal off the surface so it never z-fights with the product.
  // Expressed in model units by the caller, which knows the fit scale — a
  // fixed number here would be millimetres on one product and metres on
  // another, since imported models arrive at wildly different scales.
  const lift = projection.liftUnits ?? 0.001;
  const positionAttr = geometry.getAttribute('position');
  const normalRead = geometry.getAttribute('normal');
  for (let i = 0; i < positionAttr.count; i += 1) {
    positionAttr.setXYZ(
      i,
      positionAttr.getX(i) + normalRead.getX(i) * lift,
      positionAttr.getY(i) + normalRead.getY(i) * lift,
      positionAttr.getZ(i) + normalRead.getZ(i) * lift
    );
  }
  positionAttr.needsUpdate = true;

  geometry.userData.panelAspect = spanU / spanV;
  return geometry;
}

/**
 * Real-world size of the projected panel, so a product config can report
 * honest millimetres without anyone measuring the model by hand.
 */
export function measurePanel(geometry) {
  if (!geometry?.boundingBox) geometry?.computeBoundingBox?.();
  return geometry?.userData?.panelAspect ?? 1;
}

export default buildDecalGeometry;
