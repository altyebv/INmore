import { useState } from 'react';
import Button from '@/components/ui/Button';
import Slider from '@/components/ui/Slider';
import cx from '@/lib/utils/cx';
import { roundTo } from '@/lib/utils/math';
import { getFitWidthMm } from '@/lib/artwork/composeArtwork';
import { useT } from '@/i18n';
import { transformLimitsFor } from '../state/studioReducer';
import CropPanel from './CropPanel';
import styles from './ArtworkControls.module.css';

/**
 * Placement controls.
 *
 * The language here is deliberately physical — size, across, up, turn, repeat.
 * Nothing about textures, UV space or materials reaches the visitor.
 */
export function ArtworkControls({ product, artwork, transform, onTransform, onCommit, onReset }) {
  const [cropping, setCropping] = useState(false);
  const t = useT().studio.controls;
  const disabled = !artwork;
  const { print } = product;
  const { widthMm, xMm, yMm, rotation, repeat } = transformLimitsFor(print);

  /*
   * The sliders carry millimetres, because that is what a placement is now.
   * The readouts stay in the proportions they always showed — a percentage of
   * the print area, and a signed number for offset — because those are what a
   * visitor can actually judge. Nobody arranging a logo knows whether 96 mm is
   * a lot; everybody knows whether 40% is.
   */
  const asPercent = (v) => `${roundTo((v / print.physical.widthMm) * 100, 0)}%`;
  const acrossReadout = (v) => `${roundTo((v / (print.physical.widthMm / 2)) * 100, 0)}`;
  const upDownReadout = (v) => `${roundTo((-v / (print.physical.heightMm / 2)) * 100, 0)}`;

  const fit = (mode) => {
    if (!artwork) return;
    onTransform(
      { widthMm: getFitWidthMm(print, artwork, transform, mode), xMm: 0, yMm: 0 },
      true
    );
  };

  const centre = () => onTransform({ xMm: 0, yMm: 0 }, true);

  return (
    <div className={styles.controls}>
      <div className={cx(styles.controls, disabled && styles.disabled)} aria-disabled={disabled}>
        <Slider
          label={t.size}
          value={transform.widthMm}
          min={widthMm.min}
          max={widthMm.max}
          step={widthMm.step}
          disabled={disabled}
          format={asPercent}
          onChange={(v) => onTransform({ widthMm: v }, false)}
          onCommit={onCommit}
        />

        <Slider
          label={t.across}
          value={transform.xMm}
          min={xMm.min}
          max={xMm.max}
          step={xMm.step}
          disabled={disabled}
          format={acrossReadout}
          onChange={(v) => onTransform({ xMm: v }, false)}
          onCommit={onCommit}
        />

        <Slider
          label={t.upDown}
          value={transform.yMm}
          min={yMm.min}
          max={yMm.max}
          step={yMm.step}
          disabled={disabled}
          format={upDownReadout}
          onChange={(v) => onTransform({ yMm: v }, false)}
          onCommit={onCommit}
        />

        <Slider
          label={t.turn}
          value={transform.rotation}
          min={rotation.min}
          max={rotation.max}
          step={rotation.step}
          disabled={disabled}
          format={(v) => `${v}°`}
          onChange={(v) => onTransform({ rotation: v }, false)}
          onCommit={onCommit}
        />

        {print.wrap && (
          <Slider
            label={t.repeat}
            value={transform.repeat}
            min={repeat.min}
            max={repeat.max}
            step={repeat.step}
            disabled={disabled}
            format={(v) => (v === 1 ? t.once : `${v}×`)}
            onChange={(v) => onTransform({ repeat: v }, true)}
            onCommit={onCommit}
          />
        )}

        <div className={styles.row}>
          <Button size="sm" onClick={() => fit('contain')} disabled={disabled}>
            {t.fitHeight}
          </Button>
          <Button size="sm" onClick={centre} disabled={disabled}>
            {t.centre}
          </Button>
          <Button size="sm" onClick={() => setCropping((v) => !v)} disabled={disabled}>
            {cropping ? t.doneCropping : t.crop}
          </Button>
          <Button size="sm" variant="ghost" onClick={onReset} disabled={disabled}>
            {t.reset}
          </Button>
        </div>

        {cropping && artwork && (
          <CropPanel
            artwork={artwork}
            crop={transform.crop}
            onChange={(crop, commit) => onTransform({ crop }, commit)}
            onCommit={onCommit}
          />
        )}
      </div>

      <div className={styles.divider} />

      <ul className={styles.guidance}>
        {product.guidance.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default ArtworkControls;
