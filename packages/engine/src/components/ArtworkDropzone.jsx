import { useCallback, useRef, useState } from 'react';
import Button from '../ui/Button';
import { UploadIcon } from '../ui/icons';
import { ACCEPTED_EXTENSIONS } from '../artwork/constants';
import { formatBytes } from '../utils/format';
import { useCopy } from '../i18n';
import cx from '../utils/cx';
import { studioUtils } from '../StudioRoot';
import styles from './ArtworkDropzone.module.css';

/**
 * File intake. Drag, click or keyboard — all three land in the same place.
 * The component reports the file upward and never touches decoding itself.
 *
 * A single row rather than a tall target: a dropzone only has to be big enough
 * to aim a file at, and every line it took beyond that pushed the placement
 * controls — the part a visitor spends their time in — further down the panel.
 */
export function ArtworkDropzone({ artwork, status, error, onUpload, onClear, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const t = useCopy().dropzone;
  const loading = status === 'loading';

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

  /*
   * Shown in both states. A replacement that fails — the wrong file type, a
   * file too large — keeps the artwork that was already there, and the error
   * used to render only in the empty state, so the visitor was told nothing.
   */
  const errorMessage = error && (
    <p className={styles.error} role="alert">
      {error}
    </p>
  );

  if (artwork && !loading) {
    return (
      <div className={styles.wrap}>
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
          <div className={styles.loadedActions}>
            <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
              {t.replace}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear} aria-label={t.removeLabel}>
              {t.remove}
            </Button>
          </div>
          <input
            ref={inputRef}
            className={studioUtils.visuallyHidden}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(event) => {
              handleFiles(event.target.files);
              // Choosing the same file again should still replace it.
              event.target.value = '';
            }}
          />
        </div>
        {errorMessage}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
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
          disabled={loading}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <span className={styles.icon} aria-hidden="true">
          {loading ? <span className={styles.spinner} /> : <UploadIcon />}
        </span>
        <span className={styles.text}>
          <span className={styles.title}>
            {loading ? t.reading : compact ? t.titleTouch : t.title}
          </span>
          {!loading && <span className={cx(styles.hint, studioUtils.ltr)}>{t.hint}</span>}
        </span>
      </div>
      {errorMessage}
    </div>
  );
}

export default ArtworkDropzone;
