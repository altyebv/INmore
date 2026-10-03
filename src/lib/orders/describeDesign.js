/**
 * A studio design, in words.
 *
 * The studio's submit payload is exact and machine-shaped: millimetres, crops,
 * font files. The people who pick an order up read a line of specs, so this
 * turns one into the other. It is written in English whatever the visitor's
 * language, because it is read by staff, not by the visitor.
 *
 * The artwork file itself is not in the payload — only its name — which is why
 * the order page tells the visitor we will ask for it.
 */

const mm = (value) => `${Math.round((value ?? 0) * 10) / 10} mm`;

/** `assetHash` is `name:size:type`; a file name may itself contain colons. */
function fileName(assetHash) {
  return String(assetHash ?? '').split(':').slice(0, -2).join(':') || 'uploaded artwork';
}

function describePlacement(placement = {}) {
  const parts = [`${mm(placement.widthMm)} wide`];
  const { xMm = 0, yMm = 0 } = placement;
  const offsets = [
    xMm && `${mm(Math.abs(xMm))} ${xMm < 0 ? 'left' : 'right'}`,
    yMm && `${mm(Math.abs(yMm))} ${yMm < 0 ? 'up' : 'down'}`,
  ].filter(Boolean);
  if (offsets.length) {
    parts.push(`offset ${offsets.join(', ')} of centre`);
  } else {
    parts.push('centred');
  }
  if (placement.rotation) parts.push(`rotated ${Math.round(placement.rotation)}°`);
  if (placement.repeat > 1) parts.push(`repeated ×${placement.repeat}`);
  return parts.join(', ');
}

/**
 * @param {object|null|undefined} design  A Qreate submit payload.
 * @returns {string} Empty when there is no design.
 */
export function describeDesign(design) {
  if (!design) return '';

  const lines = ['Designed in the website studio.'];

  const colours = Object.values(design.materials ?? {}).filter(Boolean);
  if (colours.length) lines.push(`Stock colour: ${colours.join(', ')}`);

  for (const decoration of design.decorations ?? []) {
    if (decoration.type === 'text') {
      const t = decoration.text ?? {};
      lines.push(
        `Text: "${String(t.content ?? '').replace(/\n/g, ' / ')}" — ${t.fontId ?? t.family}, ` +
          `${mm(t.fontSizeMm)} type, ${t.color}, ${describePlacement(decoration.placement)}`
      );
    } else {
      lines.push(
        `Logo: ${fileName(decoration.assetHash)} — ${describePlacement(decoration.placement)}`
      );
    }
  }

  if (!(design.decorations ?? []).length) lines.push('No artwork placed.');

  return lines.join('\n');
}

export default describeDesign;
