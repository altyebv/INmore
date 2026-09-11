import { useCallback, useRef, useState } from 'react';
import Button from '../ui/Button';
import { ACCEPTED_EXTENSIONS } from '../artwork/constants';
import { formatBytes } from '../utils/format';
import { useCopy } from '../i18n';
import cx from '../utils/cx';
import { studioUtils } from '../StudioRoot';
import styles from './ArtworkDropzone.module.css';

/**
 * File intake. Drag, click or keyboard — all three land in the same place.
 * The component reports the file upward and never touches decoding itself.
 */
export function ArtworkDropzone({ artwork, status, error, onUpload, onClear, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const t = useCopy().dropzone;

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragging(false);
      handleFiles(event.dataTransfer?.files);
    },
    [handleFiles]
  );

  if (artwork && status !== 'loading') {
    return (
      <div className={styles.loaded}>
        <img className={styles.thumb} src={artwork.objectUrl} alt="" />
        <div className={styles.info}>
          <span className={styles.name} title={artwork.name}>
            {artwork.name}
          </span>
          <span className={cx(styles.detail, studioUtils.ltr)}>
            {artwork.width} × {artwork.height} · {formatBytes(artwork.size)}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
          {t.replace}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} aria-label={t.removeLabel}>
          {t.remove}
        </Button>
        <input
          ref={inputRef}
          className={studioUtils.visuallyHidden}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        className={styles.zone}
        data-active={dragging}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className={styles.input}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          aria-label={t.upload}
          disabled={status === 'loading'}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className={styles.content}>
          {status === 'loading' ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <span className={styles.hint}>{t.reading}</span>
            </>
          ) : (
            <>
              <span className={styles.title}>{compact ? t.titleTouch : t.title}</span>
              <span className={cx(styles.hint, studioUtils.ltr)}>{t.hint}</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className={styles.error} role="alert" style={{ marginTop: 'var(--space-3)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default ArtworkDropzone;
