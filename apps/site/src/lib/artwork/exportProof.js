import composeArtwork, {
  DEFAULT_PRINT_DPI,
  resolveSurface,
} from './composeArtwork';

/**
 * Render the flat print layout as a downloadable proof.
 *
 * Useful long before any ordering system exists: the visitor leaves with a
 * file they can send to us, and our production team gets the exact placement
 * the visitor approved on screen.
 *
 * Unlike the studio's own texture, this is drawn at press resolution and
 * includes the bleed. The screen shows the product as it will look finished —
 * artwork stopping at the trim line — while the press needs the margin that
 * absorbs cutting tolerance. Same placement, same compositor, two outputs.
 */
export async function exportProof(
  product,
  artwork,
  transform,
  { withGuides = true, stockColor, dpi = DEFAULT_PRINT_DPI, guideColors } = {}
) {
  const { print } = product;
  const options = { stockColor, dpi, bleed: true };

  const canvas = document.createElement('canvas');
  composeArtwork(canvas, print, artwork, transform, options);

  const surface = resolveSurface(print, options);

  /*
   * Guide colours come from the tenant, not from this module. They used to be
   * INMORE's accent and ink written as literals here — a second, invisible copy
   * of the brand, in the one output a client actually sends to a printer.
   */
  const guides = {
    safe: 'rgba(226, 72, 31, 0.85)',
    trim: 'rgba(11, 11, 10, 0.45)',
    bleed: 'rgba(11, 11, 10, 0.22)',
    ...guideColors,
  };

  if (withGuides) {
    const ctx = canvas.getContext('2d');
    const { trim, safe, bleed } = surface;

    ctx.save();
    ctx.lineWidth = Math.max(2, canvas.width * 0.0012);

    // Safe area: everything inside is guaranteed to survive the cut.
    ctx.strokeStyle = guides.safe;
    ctx.setLineDash([ctx.lineWidth * 6, ctx.lineWidth * 5]);
    ctx.strokeRect(safe.x, safe.y, safe.width, safe.height);

    // Trim: where the blade is meant to land.
    ctx.setLineDash([]);
    ctx.strokeStyle = guides.trim;
    ctx.strokeRect(trim.x, trim.y, trim.width, trim.height);

    // Bleed: how far artwork must run past it.
    if (print.physical.bleedMm) {
      ctx.strokeStyle = guides.bleed;
      ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth * 3]);
      ctx.strokeRect(bleed.x, bleed.y, bleed.width, bleed.height);
    }

    ctx.restore();
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // The name carries the resolution, because a proof is a production file and
  // the first question anyone asks of one is what it was rendered at.
  link.download = `inmore-${product.slug}-proof-${Math.round(surface.dpi)}dpi.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return blob;
}

export default exportProof;
