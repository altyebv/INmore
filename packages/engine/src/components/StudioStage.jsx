import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { DownloadIcon } from '../ui/icons';
import cx from '../utils/cx';
import ProductViewer from '../three/ProductViewer';
import useModelAvailability from '../three/models/useModelAvailability';
import useMediaQuery, { COARSE_POINTER_QUERY } from '../utils/useMediaQuery';
import { useAsset } from '../assets';
import { useCopy } from '../i18n';
import styles from './StudioStage.module.css';

/**
 * The product view, and whatever floats over it.
 *
 * Auto-rotation runs until the visitor touches the model, then stops for good —
 * motion introduces the object, it does not fight the person inspecting it.
 *
 * The overlay has three slots rather than fixed contents, because what belongs
 * over the product depends on the arrangement around it: the product switcher
 * sits at the top in both layouts, the history controls and proof download
 * join it on a desktop, and on touch the call to action floats at the bottom
 * where a thumb reaches it.
 */

/*
 * On touch the stage is the whole screen and usually portrait, so the product
 * is framed tighter than on a desktop stage. Only the framing is overridden —
 * the viewing direction stays the product's own, since that is chosen to show
 * the print: a box is seen from above because its lid is what gets printed.
 */
const COMPACT_CAMERA = { framing: 1.4 };

export function StudioStage({
  product,
  texture,
  baseColor,
  autoRotate,
  onInteract,
  onExport,
  canExport,
  compact = false,
  header,
  actions,
  footer,
  className,
}) {
  const [touched, setTouched] = useState(false);
  const modelStatus = useModelAvailability(useAsset(product.model.url));
  const coarse = useMediaQuery(COARSE_POINTER_QUERY);
  const t = useCopy();

  useEffect(() => setTouched(false), [product.id]);

  const handleInteract = () => {
    setTouched(true);
    onInteract?.();
  };

  const exportButton = onExport && !compact && (
    <Button size="sm" variant="glass" onClick={onExport} disabled={!canExport}>
      <DownloadIcon />
      {t.downloadProof}
    </Button>
  );

  return (
    <div className={cx(styles.stage, compact && styles.compact, className)}>
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
        <div className={styles.top}>
          {header && <div className={styles.header}>{header}</div>}
          {(actions || exportButton) && (
            <div className={styles.actions}>
              {actions}
              {exportButton}
            </div>
          )}
        </div>

        <div className={styles.bottom}>
          <div className={styles.status}>
            {!compact && (
              <p className={styles.caption}>
                <span className={styles.name}>{product.name}</span>
                {product.category && <span className={styles.category}>{product.category}</span>}
              </p>
            )}
            <span className={cx(styles.hint, touched && styles.hintHidden)}>
              {coarse ? t.orbitHintTouch : t.orbitHint}
            </span>
            {footer && <div className={styles.footer}>{footer}</div>}
          </div>

          {modelStatus === 'missing' && !compact && (
            <p className={styles.notice}>{t.referenceGeometry}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudioStage;
