/**
 * The host bridge.
 *
 * The studio runs in an iframe, so everything between it and the page it sits
 * on goes through `postMessage`. This module is the only description of that
 * conversation, and both sides import it — a protocol defined twice is a
 * protocol that will disagree with itself.
 *
 * Two rules that shape everything below:
 *
 * 1. **Every message is tagged and origin-checked.** A host page is full of
 *    other people's postMessage traffic — analytics, chat widgets, payment
 *    frames — and any of it can look like ours if we only check the shape.
 *    Both sides verify the origin and the tag before reading a payload.
 *
 * 2. **Nothing large crosses the bridge.** A preview thumbnail as a data URL
 *    is megabytes of base64 through a structured clone on the host's main
 *    thread, and the host's own page is what janks. Previews travel as a
 *    reference to something already uploaded; the payload stays small enough
 *    to be boring.
 */

/** Tags. Distinct per direction so a message can never be read by its sender. */
export const FROM_STUDIO = 'inmore-studio';
export const FROM_HOST = 'inmore-studio-host';

/** Messages the studio sends out. */
export const STUDIO_EVENTS = {
  /** The studio is mounted and usable. Payload: { tenant, sku, locale }. */
  READY: 'ready',
  /** The visitor finished. Payload: the submit payload. */
  SUBMIT: 'submit',
  /** Something the visitor changed. Payload: { name, data }. */
  CONFIG_CHANGE: 'configChange',
  /** The studio could not start. Payload: { code, message }. */
  ERROR: 'error',
  /** The studio wants a different height. Payload: { height }. */
  RESIZE: 'resize',
};

/** Messages the host sends in. */
export const HOST_COMMANDS = {
  SET_LOCALE: 'setLocale',
  SET_SKU: 'setSku',
  /** Asks the studio to report its current configuration without submitting. */
  REQUEST_STATE: 'requestState',
};

/**
 * Why a studio failed to start.
 *
 * Each of these has a specific message in the fallback, because "something
 * went wrong" on a client's live product page helps nobody — least of all the
 * client, who is the one who has to work out whether it is their fault.
 */
export const ERROR_CODES = {
  NO_WEBGL: 'no-webgl',
  CONFIG_UNREACHABLE: 'config-unreachable',
  CONFIG_INVALID: 'config-invalid',
  UNKNOWN_SKU: 'unknown-sku',
  UNLICENSED: 'unlicensed',
  UNKNOWN: 'unknown',
};

/** Build a message from the studio. */
export function studioMessage(type, payload) {
  return { source: FROM_STUDIO, type, payload };
}

/** Build a message from the host. */
export function hostMessage(type, payload) {
  return { source: FROM_HOST, type, payload };
}

/**
 * Is this a message we should read?
 *
 * @param {MessageEvent} event
 * @param {string} expectedSource One of the tags above.
 * @param {string} [expectedOrigin] Checked when given; '*' skips it.
 */
export function isOurMessage(event, expectedSource, expectedOrigin) {
  if (!event?.data || typeof event.data !== 'object') return false;
  if (event.data.source !== expectedSource) return false;
  if (expectedOrigin && expectedOrigin !== '*' && event.origin !== expectedOrigin) return false;
  return true;
}
