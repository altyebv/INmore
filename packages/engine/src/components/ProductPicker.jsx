import { useMemo } from 'react';
import { localizeProduct } from '../catalogue';
import { useCopy, useStudioLocale } from '../i18n';
import { useStudio } from '../state/StudioProvider';
import styles from './ProductPicker.module.css';

/**
 * Product selection.
 *
 * Reads this studio's catalogue, so a newly configured product appears here
 * with no change to this component — and two studios on one page each list
 * their own. Announced-but-unbuilt products are shown as unavailable rather
 * than hidden: the range is real, the models are not all finished.
 */
export function ProductPicker({ selectedId, onSelect }) {
  const { catalogue } = useStudio();
  const { locale } = useStudioLocale();
  const t = useCopy();

  // Names and categories are read on screen, so they have to be the visitor's.
  // Only the readable fields are swapped; what reaches the picker is still a
  // complete product config.
  const products = useMemo(
    () => catalogue.all.map((product) => localizeProduct(product, locale)),
    [catalogue, locale]
  );

  return (
    <div className={styles.list} role="group" aria-label={t.chooseProduct}>
      {products.map((product) => {
        const live = product.status === 'live';
        return (
          <button
            key={product.id}
            type="button"
            className={styles.item}
            aria-pressed={product.id === selectedId}
            disabled={!live}
            title={live ? product.summary : t.modelInPreparation}
            onClick={() => live && onSelect(product)}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.body}>
              <span className={styles.name}>{product.name}</span>
              <span className={styles.category}>{product.category}</span>
            </span>
            {!live && <span className={styles.badge}>{t.comingSoon}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ProductPicker;
