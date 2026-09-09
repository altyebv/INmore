import composeArtwork, { getPrintRect, getSafeRect } from './composeArtwork';

/**
 * Render the flat print layout as a downloadable proof.
 *
 * Useful long before any ordering system exists: the visitor leaves with a
 * file they can send to us, and our production team gets the exact placement
 * the visitor approved on screen.
 */
export async function exportProof(product, artwork, transform, { withGuides = true } = {}) {
  const { print } = product;
  const canvas = document.createElement('canvas');
  composeArtwork(canvas, print, artwork, transform);

  if (withGuides) {
    const ctx = canvas.getContext('2d');
    const rect = getPrintRect(print);
    const safe = getSafeRect(print);

    ctx.save();
    ctx.lineWidth = Math.max(2, canvas.width * 0.0012);
    ctx.strokeStyle = 'rgba(226, 72, 31, 0.85)';
    ctx.setLineDash([ctx.lineWidth * 6, ctx.lineWidth * 5]);
    ctx.strokeRect(safe.x, safe.y, safe.width, safe.height);

    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(11, 11, 10, 0.45)';
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inmore-${product.slug}-proof.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return blob;
}

export default exportProof;
