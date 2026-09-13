import { useEffect, useMemo, useRef } from 'react';
import { localizeProduct } from '../catalogue';
import { useCopy, useStudioLocale } from '../i18n';
import { useStudio } from '../state/StudioProvider';
import cx from '../utils/cx';
import styles from './ProductPicker.module.css';

/**
 * Product selection, as a strip of chips over the product itself.
 *
 * It used to be a list at the top of the control panel: six rows, a third of
 * the panel before the visitor reached anything they had come to change.
 * Choosing what to look at belongs with the thing being looked at, and a strip
 * costs one line.
 *
 * Reads this studio's catalogue, so a newly configured product appears here
 * with no change to this component — and two studios on one page each list
 * their own. Announced-but-unbuilt products are shown as unavailable rather
 * than hidden: the range is real, the models are not all finished.
 */
export function ProductPicker({ selectedId, onSelect, className }) {
  const { catalogue } = useStudio();
  const { locale } = useStudioLocale();
  const t = useCopy();
  const stripRef = useRef(null);

  // Names are read on screen, so they have to be the visitor's. Only the
  // readable fields are swapped; what reaches `onSelect` is a complete config.
  const products = useMemo(
    () => catalogue.all.map((product) => localizeProduct(product, locale)),
    [catalogue, locale]
  );

  /*
   * Keep the selected chip in view when the strip overflows, or a product the
   * host selected can be chosen somewhere off its end.
   *
   * The strip is scrolled directly rather than with `scrollIntoView`, which
   * scrolls every ancestor too: on a host page it would drag the page down to
   * a studio the visitor had not scrolled to yet.
   */
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector('[aria-pressed="true"]');
    if (!chip || typeof strip.scrollBy !== 'function') return;

    const bounds = strip.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    const margin = 24;
    if (box.left < bounds.left) {
      strip.scrollBy({ left: box.left - bounds.left - margin, behavior: 'smooth' });
    } else if (box.right > bounds.right) {
      strip.scrollBy({ left: box.right - bounds.right + margin, behavior: 'smooth' });
    }
  }, [selectedId, products]);

  return (
    <div
      ref={stripRef}
      className={cx(styles.strip, className)}
      role="group"
      aria-label={t.chooseProduct}
    >
      {products.map((product) => {
        const live = product.status === 'live';
        return (
          <button
            key={product.id}
            type="button"
            className={styles.chip}
            aria-pressed={product.id === selectedId}
            disabled={!live}
            title={live ? product.name : `${product.name} · ${t.modelInPreparation}`}
            onClick={() => live && onSelect(product)}
          >
            <span>{product.shortName ?? product.name}</span>
            {!live && <span className={styles.soon}>{t.comingSoon}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ProductPicker;
