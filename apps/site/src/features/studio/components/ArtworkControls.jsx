import { useState } from 'react';
import Button from '@/components/ui/Button';
import Slider from '@/components/ui/Slider';
import cx from '@/lib/utils/cx';
import { roundTo } from '@/lib/utils/math';
import { getFitScale } from '@/lib/artwork/composeArtwork';
import { useT } from '@/i18n';
import { TRANSFORM_LIMITS } from '../state/studioReducer';
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
  const { scale, offset, rotation, repeat } = TRANSFORM_LIMITS;

  const fit = (mode) => {
    if (!artwork) return;
    onTransform({ scale: getFitScale(product.print, artwork, transform, mode), x: 0, y: 0 }, true);
  };

  const centre = () => onTransform({ x: 0, y: 0 }, true);

  return (
    <div className={styles.controls}>
      <div className={cx(styles.controls, disabled && styles.disabled)} aria-disabled={disabled}>
        <Slider
          label={t.size}
          value={transform.scale}
          min={scale.min}
          max={scale.max}
          step={scale.step}
          disabled={disabled}
          format={(v) => `${roundTo(v * 100, 0)}%`}
          onChange={(v) => onTransform({ scale: v }, false)}
          onCommit={onCommit}
        />

        <Slider
          label={t.across}
          value={transform.x}
          min={offset.min}
          max={offset.max}
          step={offset.step}
          disabled={disabled}
          format={(v) => `${roundTo(v * 100, 0)}`}
          onChange={(v) => onTransform({ x: v }, false)}
          onCommit={onCommit}
        />

        <Slider
          label={t.upDown}
          value={transform.y}
          min={offset.min}
          max={offset.max}
          step={offset.step}
          disabled={disabled}
          format={(v) => `${roundTo(-v * 100, 0)}`}
          onChange={(v) => onTransform({ y: v }, false)}
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

        {product.print.wrap && (
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
