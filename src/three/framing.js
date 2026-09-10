import * as THREE from 'three';

/**
 * Work out where the camera goes for a product.
 *
 * Products differ in size by an order of magnitude — a 93 mm cup and a 340 mm
 * shopping bag. Hand-tuning a camera position per product means every new
 * model needs someone to sit and nudge numbers until it looks right, and they
 * end up framed inconsistently anyway.
 *
 * So a product config gives a viewing *direction* and how tightly to frame,
 * and the distance is computed from the product's real height and the lens.
 * Every product then fills the same share of the frame, and a new one is
 * framed correctly the moment its height is declared.
 */
export function resolveCamera(product, overrides = {}, measuredRadius) {
  const config = { ...product.camera, ...overrides };

  const direction = new THREE.Vector3(...(config.position ?? [0.5, 0.35, 1])).normalize();
  const framing = config.framing ?? 1.35;
  const fov = config.fov ?? 26;

  /*
   * Frame by the product's bounding sphere, not its height. A cube seen from a
   * corner presents about 1.4× its own edge length, so height alone puts the
   * camera inside boxy products. The radius is measured from the loaded model
   * where one is available, and estimated from the declared height until then,
   * so the first frame is close and the corrected one does not jump.
   */
  const radius = measuredRadius ?? (product.model?.heightM ?? 0.1) * 0.62;
  const distance = (radius * framing) / Math.sin((fov / 2) * THREE.MathUtils.DEG2RAD);

  return {
    fov,
    position: direction.clone().multiplyScalar(distance).toArray(),
    target: config.target ?? [0, 0, 0],
    distance,
    minDistance: config.minDistance ?? distance * 0.55,
    maxDistance: config.maxDistance ?? distance * 2.6,
    minPolarAngle: config.minPolarAngle ?? 0.3,
    maxPolarAngle: config.maxPolarAngle ?? 1.95,
  };
}

export default resolveCamera;
