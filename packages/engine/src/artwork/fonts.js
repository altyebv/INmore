import { useSyncExternalStore } from 'react';
import { resolveAsset } from '../assets';

/**
 * Loading a tenant's fonts for the canvas.
 *
 * Text is drawn on a canvas, and a canvas does not wait for a font: asked for
 * one that has not arrived, it silently draws in the fallback. So a font has
 * to be *loaded* — through the FontFace API, not a stylesheet — and whoever
 * drew before it arrived has to draw again after. This module does the first
 * and tells everyone about the second.
 *
 * FontFace rather than a `<link>` for three reasons: a stylesheet is a CSP
 * question in a host page's frame, the promise says exactly when the glyphs
 * are usable, and a face can be registered under a private name, so a tenant's
 * "Inter" never collides with the host's.
 *
 * A font with no files is a system font: nothing to load, always ready.
 */

const loaded = new Set();
const pending = new Map();
const listeners = new Set();
let version = 0;

const bump = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

const keyFor = (font, assetBase) => `${font.name}|${assetBase ?? ''}`;

export const isFontReady = (font, assetBase = '') =>
  !font?.files?.length || loaded.has(keyFor(font, assetBase));

/**
 * Load every file of a font. Resolves whether or not it worked — a font that
 * fails to load leaves the fallback in its stack doing the job, and text in
 * the fallback is a better outcome than a studio that will not open.
 */
export function ensureFont(font, assetBase = '') {
  if (!font || isFontReady(font, assetBase)) return Promise.resolve();
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return Promise.resolve();
  }

  const key = keyFor(font, assetBase);
  if (pending.has(key)) return pending.get(key);

  const job = Promise.all(
    font.files.map((file) => {
      const face = new FontFace(font.name, `url(${resolveAsset(assetBase, file.url)})`, {
        weight: String(font.weight ?? 400),
        style: font.style ?? 'normal',
        ...(file.unicodeRange ? { unicodeRange: file.unicodeRange } : {}),
      });
      return face.load().then((ready) => {
        document.fonts.add(ready);
      });
    })
  )
    .then(() => {
      loaded.add(key);
    })
    .catch((error) => {
      // Not marked loaded: a later call may retry. Say so once, in the console.
      console.warn(`[studio] font "${font.id}" did not load.`, error);
    })
    .finally(() => {
      pending.delete(key);
      bump();
    });

  pending.set(key, job);
  return job;
}

export const ensureFonts = (fonts, assetBase) =>
  Promise.all(fonts.map((font) => ensureFont(font, assetBase)));

/**
 * Re-render when any font finishes loading. Returns a number that only ever
 * grows; put it in a dependency list to redraw when it changes.
 */
export function useFontVersion() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
    () => 0
  );
}

/** For tests: forget everything that was loaded. */
export function resetFontState() {
  loaded.clear();
  pending.clear();
  version = 0;
}
