import { useCopy } from '../i18n';
import styles from './ProductDetails.module.css';

/**
 * What a product is, in words: its summary, its specification and the print
 * guidance for it.
 *
 * None of it changes the configuration, so it is reference rather than a
 * control — which is why both layouts put it one tap away instead of between
 * choosing a stock and placing a logo, where it used to add a screen of
 * scrolling to every visit.
 */
export function ProductDetails({ product }) {
  const t = useCopy();

  return (
    <div className={styles.details}>
      {product.summary && <p className={styles.summary}>{product.summary}</p>}

      {product.specs?.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.heading}>{t.specs}</h3>
          <dl className={styles.specs}>
            {product.specs.map((spec) => (
              <div key={spec.label} className={styles.spec}>
                <dt>{spec.label}</dt>
                <dd className={styles.specValue}>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {product.guidance?.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.heading}>{t.guidance}</h3>
          <ul className={styles.guidance}>
            {product.guidance.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
