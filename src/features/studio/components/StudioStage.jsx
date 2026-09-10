import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import cx from '@/lib/utils/cx';
import ProductViewer from '@/three/ProductViewer';
import useModelAvailability from '@/three/models/useModelAvailability';
import useMediaQuery, { COARSE_POINTER_QUERY } from '@/lib/utils/useMediaQuery';
import { useT } from '@/i18n';
import styles from './StudioStage.module.css';

/**
 * The product view.
 *
 * Auto-rotation runs until the visitor touches the model, then stops for good —
 * motion introduces the object, it does not fight the person inspecting it.
 */
/** The touch stage is short and wide, so the product is framed tighter. */
const COMPACT_CAMERA = { position: [0.45, 0.24, 1], fov: 28, framing: 1.35 };

export function StudioStage({
  product,
  texture,
  baseColor,
  autoRotate,
  onInteract,
  onExport,
  canExport,
  compact = false,
}) {
  const [touched, setTouched] = useState(false);
  const modelStatus = useModelAvailability(product.model.url);
  const coarse = useMediaQuery(COARSE_POINTER_QUERY);
  const t = useT().studio;

  useEffect(() => setTouched(false), [product.id]);

  const handleInteract = () => {
    setTouched(true);
    onInteract?.();
  };

  return (
    <div className={cx(styles.stage, compact && styles.compact)}>
      <ProductViewer
        className={styles.canvas}
        product={product}
        texture={texture}
        baseColor={baseColor}
        autoRotate={autoRotate && !touched}
        onInteract={handleInteract}
        camera={compact ? COMPACT_CAMERA : undefined}
      />

      <div className={styles.overlay}>
        <div className={styles.overlayRow}>
          <span className={styles.caption}>{product.name}</span>
          {!compact && (
            <div className={styles.tools}>
              <Button size="sm" variant="ghost" onClick={onExport} disabled={!canExport}>
                {t.downloadProof}
              </Button>
            </div>
          )}
        </div>

        <div className={styles.overlayRow}>
          <span className={cx(styles.hint, touched && styles.hintHidden)}>
            {coarse ? t.orbitHintTouch : t.orbitHint}
          </span>
          {modelStatus === 'missing' && !compact && (
            <p className={styles.notice}>{t.referenceGeometry}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudioStage;
