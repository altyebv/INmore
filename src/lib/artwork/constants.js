/** Formats the browser can decode and we can composite reliably. */
export const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];

export const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.webp,.svg';

/** 25 MB. Large enough for a press-resolution logo, small enough to decode fast. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Below this we warn that the result will look soft on a printed surface. */
export const LOW_RES_MIN_EDGE = 600;

/** Upper bound on the decoded bitmap we keep in memory. */
export const MAX_SOURCE_EDGE = 4096;

export const IDENTITY_CROP = { x: 0, y: 0, width: 1, height: 1 };

export const ERROR_MESSAGES = {
  type: 'That file type is not supported. Use a PNG, JPG, WEBP or SVG.',
  size: 'That file is larger than 25 MB. Export a smaller version and try again.',
  decode: 'We could not read that image. It may be corrupted or use an unusual encoding.',
  empty: 'No file was received.',
};
