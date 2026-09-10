import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import composeArtwork from '@/lib/artwork/composeArtwork';

/**
 * Keep a canvas texture in sync with the studio's artwork placement.
 *
 * The canvas is allocated once per product and redrawn in place, so dragging
 * the artwork does not churn GPU memory. We only ask three.js to re-upload the
 * texture, which is the cheap part.
 *
 * How the stock colour reaches the product depends on how the product prints.
 * A wrapped surface takes one texture covering the whole panel, so the stock is
 * painted into it. A projected decal sits *over* the product's own material, so
 * its background must be transparent and the stock colour comes from the mesh
 * underneath — which is also why changing stock does not force a redraw there.
 */
export function useArtworkTexture(product, artwork, transform, baseColor) {
  const canvasRef = useRef(null);

  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas');
  }

  const isDecal = (product.print.mode ?? 'texture') === 'decal';

  const texture = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.wrapS = product.print.wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
    // A new texture object is only needed when the surface itself changes.
  }, [product.id, product.print.wrap]);

  useEffect(() => () => texture?.dispose(), [texture]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !texture) return;
    composeArtwork(canvas, product.print, artwork, transform, {
      transparentBackground: isDecal,
      stockColor: baseColor,
    });
    texture.needsUpdate = true;
  }, [texture, product.print, artwork, transform, baseColor, isDecal]);

  return { texture, canvas: canvasRef.current };
}

export default useArtworkTexture;
