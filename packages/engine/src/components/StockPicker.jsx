import { useMemo } from 'react';
import { paletteFor } from '../catalogue';
import { useCopy, useStudioLocale, localize } from '../i18n';
import cx from '../utils/cx';
import { studioUtils } from '../StudioRoot';
import styles from './StockPicker.module.css';

/**
 * Choose the stock the product is made from.
 *
 * Offered as named board and paper stocks rather than a colour wheel, because
 * that is what a print house actually sells and what determines the price. The
 * custom swatch stays available for a client matching an existing brand
 * colour — they can pick anything, and we tell them at quote stage whether it
 * is a stock or a printed flood.
 */
export function StockPicker({ product, value, onChange }) {
  const t = useCopy().stock;
  const { locale } = useStudioLocale();
  const palette = useMemo(() => paletteFor(product), [product]);

  const active = palette.find((stock) => stock.color.toLowerCase() === value?.toLowerCase());

  /*
   * Board names are the client's, not the engine's — "Natural kraft" is what
   * this print house calls it, and the next one may not stock it at all. So a
   * stock carries its own label, either as a plain string or as a map of
   * locale to string, and the engine only chooses between what it was given.
   */
  const localised = (stock) => localize(stock.label, locale);

  return (
    <div className={styles.picker}>
      <div className={styles.swatches} role="group" aria-label={t.label}>
        {palette.map((stock) => (
          <button
            key={stock.id}
            type="button"
            className={styles.swatch}
            style={{ '--swatch': stock.color }}
            aria-pressed={stock.color.toLowerCase() === value?.toLowerCase()}
            aria-label={localised(stock)}
            title={localised(stock)}
            onClick={() => onChange(stock.color)}
          />
        ))}

        <label className={cx(styles.custom)} title={t.custom}>
          <span aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <span className={studioUtils.visuallyHidden}>{t.custom}</span>
          <input
            type="color"
            className={styles.customInput}
            value={value ?? '#ffffff'}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>

      <p className={styles.caption}>
        <span className={styles.name}>{active ? localised(active) : t.custom}</span>
        <span className={cx(styles.value, studioUtils.ltr)}>{value}</span>
      </p>
    </div>
  );
}

export default StockPicker;
