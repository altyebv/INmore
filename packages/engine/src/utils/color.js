/**
 * A hex colour as an `rgba()` string at the given alpha.
 *
 * Guide colours on a proof need transparency a tenant's branding never
 * declares — branding is opaque hex, chosen for CSS custom properties — so
 * this is the seam between the two: a tenant names a colour, a caller decides
 * how see-through it needs to be.
 *
 * Returns `undefined` for anything that is not recognisably a hex colour,
 * so a caller can `??` it away rather than paint a proof with "undefined".
 */
export function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return undefined;

  const value = hex.trim().replace(/^#/, '');
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return undefined;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default hexToRgba;
