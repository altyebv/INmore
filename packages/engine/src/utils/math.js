export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const lerp = (a, b, t) => a + (b - a) * t;

/** Map a value from one range to another, clamped. */
export const mapRange = (v, inMin, inMax, outMin, outMax) =>
  outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

export const roundTo = (v, decimals = 2) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

export const degToRad = (deg) => (deg * Math.PI) / 180;
