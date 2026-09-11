import {
  ACCEPTED_MIME_TYPES,
  ERROR_MESSAGES,
  LOW_RES_MIN_EDGE,
  MAX_FILE_BYTES,
  MAX_SOURCE_EDGE,
} from './constants';

/**
 * Carries a stable `code` rather than a message. The studio maps the code to
 * copy in the visitor's language; this module stays free of presentation.
 */
export class ArtworkError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.decode);
    this.name = 'ArtworkError';
    this.code = code;
  }
}

function decodeImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ArtworkError('decode'));
    img.src = url;
  });
}

/**
 * SVGs have no intrinsic pixel size we can trust. Rasterise them once at a
 * generous resolution so downstream compositing is a plain bitmap draw.
 */
function rasterise(img, targetEdge) {
  const ratio = img.naturalWidth / img.naturalHeight || 1;
  const width = ratio >= 1 ? targetEdge : Math.round(targetEdge * ratio);
  const height = ratio >= 1 ? Math.round(targetEdge / ratio) : targetEdge;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Validate and decode a user-supplied file into a drawable source.
 *
 * @param {File} file
 * @returns {Promise<{
 *   source: CanvasImageSource,
 *   width: number,
 *   height: number,
 *   aspect: number,
 *   name: string,
 *   size: number,
 *   type: string,
 *   objectUrl: string,
 *   isLowResolution: boolean,
 * }>}
 */
export async function loadArtwork(file) {
  if (!file) throw new ArtworkError('empty');
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) throw new ArtworkError('type');
  if (file.size > MAX_FILE_BYTES) throw new ArtworkError('size');

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await decodeImage(objectUrl);
    const isVector = file.type === 'image/svg+xml';

    let source = img;
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    if (isVector) {
      const canvas = rasterise(img, MAX_SOURCE_EDGE / 2);
      source = canvas;
      width = canvas.width;
      height = canvas.height;
    } else if (Math.max(width, height) > MAX_SOURCE_EDGE) {
      const scale = MAX_SOURCE_EDGE / Math.max(width, height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      source = canvas;
      width = canvas.width;
      height = canvas.height;
    }

    return {
      source,
      width,
      height,
      aspect: width / height,
      name: file.name,
      size: file.size,
      type: file.type,
      objectUrl,
      isLowResolution: !isVector && Math.min(width, height) < LOW_RES_MIN_EDGE,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error instanceof ArtworkError ? error : new ArtworkError('decode');
  }
}

export function releaseArtwork(artwork) {
  if (artwork?.objectUrl) URL.revokeObjectURL(artwork.objectUrl);
}
