import { useEffect, useRef, useState } from 'react';
import Reveal from '@/components/ui/Reveal';
import { useContent, useLocale } from '@/i18n';
import styles from './ProductGallery.module.css';

export function ProductGallery() {
  const { ui } = useContent();
  const { isRTL } = useLocale();
  const copy = ui.home;
  const track = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = track.current;
    if (!node) return undefined;

    const onScroll = () => {
      const cards = [...node.children];
      const closest = cards.reduce((best, card, index) => {
        const distance = Math.abs(card.offsetLeft - node.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      setActive(closest.index);
    };

    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, []);

  const move = (direction) => {
    const total = copy.products.length;
    const next = (active + direction + total) % total;
    const node = track.current;
    const card = node?.children[next];

    if (node && card) {
      node.scrollTo({
        left: card.offsetLeft - node.offsetLeft,
        behavior: 'smooth',
      });
    }

    setActive(next);
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.toolbar}>
        <p className="u-label">{copy.galleryLabel}</p>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            aria-label={copy.previousGallery}
            onClick={() => move(isRTL ? 1 : -1)}
          >
            <span aria-hidden="true">{isRTL ? '→' : '←'}</span>
          </button>
          <span className={styles.counter} aria-live="polite">
            {String(active + 1).padStart(2, '0')} / {String(copy.products.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            className={styles.control}
            aria-label={copy.nextGallery}
            onClick={() => move(isRTL ? -1 : 1)}
          >
            <span aria-hidden="true">{isRTL ? '←' : '→'}</span>
          </button>
        </div>
      </div>

      <div className={styles.track} ref={track} tabIndex={0} aria-label={copy.galleryLabel}>
        {copy.products.map((product, index) => (
          <Reveal key={product.id} className={styles.card} delay={index * 50}>
            <figure className={styles.figure}>
              <img src={product.image} alt={product.alt} loading={index < 2 ? 'eager' : 'lazy'} />
              <figcaption className={styles.caption}>
                <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{product.title}</strong>
                  <small>{product.body}</small>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default ProductGallery;