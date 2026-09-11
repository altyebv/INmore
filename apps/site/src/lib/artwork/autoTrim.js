import { IDENTITY_CROP } from './constants';

/**
 * Find the tightest crop that still contains every non-transparent pixel.
 *
 * Logos are almost always exported with generous transparent padding, which
 * makes them look far too small the moment they are placed on a product. We
 * remove that padding automatically so the first thing the visitor sees is a
 * sensibly sized mark.
 *
 * @returns {{x:number,y:number,width:number,height:number}} normalised crop
 */
export function autoTrim(source, width, height, alphaThreshold = 8) {
  const sampleEdge = 512;
  const scale = Math.min(1, sampleEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return IDENTITY_CROP;
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fully transparent, or fully opaque with no padding to remove.
  if (maxX < 0) return IDENTITY_CROP;
  if (minX === 0 && minY === 0 && maxX === w - 1 && maxY === h - 1) return IDENTITY_CROP;

  const pad = 1;
  const x0 = Math.max(0, minX - pad) / w;
  const y0 = Math.max(0, minY - pad) / h;
  const x1 = Math.min(w, maxX + 1 + pad) / w;
  const y1 = Math.min(h, maxY + 1 + pad) / h;

  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

export default autoTrim;
