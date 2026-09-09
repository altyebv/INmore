import { useEffect, useRef, useState } from 'react';
import cx from '@/lib/utils/cx';
import styles from './Reveal.module.css';

/**
 * Reveal content as it enters the viewport.
 *
 * Motion here exists to pace reading, not to decorate: one short upward move,
 * once, and never again on scroll back. Respects reduced-motion via CSS.
 */
export function Reveal({ as: Tag = 'div', delay = 0, shift, className, children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cx(styles.reveal, visible && styles.visible, className)}
      style={{
        '--reveal-delay': `${delay}ms`,
        ...(shift ? { '--reveal-shift': shift } : null),
        ...props.style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
