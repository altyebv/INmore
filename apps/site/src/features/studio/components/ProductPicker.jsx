import { useLocalizedCatalogue, useT } from '@/i18n';
import styles from './ProductPicker.module.css';

/**
 * Product selection.
 *
 * Reads straight from the registry, so a newly configured product appears here
 * with no change to this component. Announced-but-unbuilt products are shown
 * as unavailable rather than hidden — the range is real, the models are not
 * all finished.
 */
export function ProductPicker({ selectedId, onSelect }) {
  const catalogue = useLocalizedCatalogue();
  const t = useT().studio;

  return (
    <div className={styles.list} role="group" aria-label={t.chooseProduct}>
      {catalogue.map((product) => {
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
