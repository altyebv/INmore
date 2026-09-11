import { useCallback, useRef } from 'react';
import Button from '../ui/Button';
import { clamp } from '../utils/math';
import { IDENTITY_CROP } from '../artwork/constants';
import autoTrim from '../artwork/autoTrim';
import { useCopy } from '../i18n';
import styles from './CropPanel.module.css';

const MIN_SIZE = 0.06;

/**
 * Crop the source artwork before it is placed.
 *
 * Works in normalised coordinates so the result is independent of the image's
 * pixel size and of how large the panel happens to be rendered.
 */
export function CropPanel({ artwork, crop, onChange, onCommit }) {
  const t = useCopy().crop;
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const begin = useCallback(
    (mode) => (event) => {
      event.preventDefault();
      event.stopPropagation();
      const stage = stageRef.current;
      if (!stage) return;
      stage.setPointerCapture(event.pointerId);
      dragRef.current = {
        mode,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...crop },
        width: stage.clientWidth,
        height: stage.clientHeight,
      };
    },
    [crop]
  );

  const move = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / drag.width;
      const dy = (event.clientY - drag.startY) / drag.height;
      const o = drag.origin;

      let next;
      if (drag.mode === 'move') {
        next = {
          ...o,
          x: clamp(o.x + dx, 0, 1 - o.width),
          y: clamp(o.y + dy, 0, 1 - o.height),
        };
      } else {
        let { x, y, width, height } = o;
        if (drag.mode.includes('w')) {
          const nx = clamp(o.x + dx, 0, o.x + o.width - MIN_SIZE);
          width = o.width + (o.x - nx);
          x = nx;
        }
        if (drag.mode.includes('e')) {
          width = clamp(o.width + dx, MIN_SIZE, 1 - o.x);
        }
        if (drag.mode.includes('n')) {
          const ny = clamp(o.y + dy, 0, o.y + o.height - MIN_SIZE);
          height = o.height + (o.y - ny);
          y = ny;
        }
        if (drag.mode.includes('s')) {
          height = clamp(o.height + dy, MIN_SIZE, 1 - o.y);
        }
        next = { x, y, width, height };
      }

      onChange(next, false);
    },
    [onChange]
  );

  const end = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    onCommit?.();
  }, [onCommit]);

  const reset = () => onChange(IDENTITY_CROP, true);
  const trim = () =>
    onChange(autoTrim(artwork.source, artwork.width, artwork.height), true);

  const box = {
    left: `${crop.x * 100}%`,
    top: `${crop.y * 100}%`,
    width: `${crop.width * 100}%`,
    height: `${crop.height * 100}%`,
  };

  return (
    <div className={styles.panel}>
      <div
        ref={stageRef}
        className={styles.stage}
        style={{ '--crop-aspect': artwork.aspect }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <img className={styles.image} src={artwork.objectUrl} alt="" draggable="false" />
        <div
          className={styles.window}
          style={box}
          onPointerDown={begin('move')}
          role="group"
          aria-label={t.area}
        >
          <div className={styles.grid} aria-hidden="true">
            <span className={styles.gridLine} style={{ left: '33.33%', top: 0, bottom: 0, width: 1 }} />
            <span className={styles.gridLine} style={{ left: '66.66%', top: 0, bottom: 0, width: 1 }} />
            <span className={styles.gridLine} style={{ top: '33.33%', left: 0, right: 0, height: 1 }} />
            <span className={styles.gridLine} style={{ top: '66.66%', left: 0, right: 0, height: 1 }} />
          </div>
          <span className={`${styles.handle} ${styles.nw}`} onPointerDown={begin('nw')} />
          <span className={`${styles.handle} ${styles.ne}`} onPointerDown={begin('ne')} />
          <span className={`${styles.handle} ${styles.sw}`} onPointerDown={begin('sw')} />
          <span className={`${styles.handle} ${styles.se}`} onPointerDown={begin('se')} />
        </div>
      </div>

      <div className={styles.actions}>
        <Button size="sm" onClick={trim}>
          {t.trim}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          {t.whole}
        </Button>
      </div>

      <p className={styles.note}>{t.note}</p>
    </div>
  );
}

export default CropPanel;
