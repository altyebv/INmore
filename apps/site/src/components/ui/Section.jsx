import cx from '@/lib/utils/cx';
import Reveal from './Reveal';
import styles from './Section.module.css';

export function Section({ id, eyebrow, title, lede, tight, className, children, ...props }) {
  return (
    <section id={id} className={cx(styles.section, tight && styles.tight, className)} {...props}>
      <div className="u-shell">
        {(eyebrow || title || lede) && (
          <header className={styles.header}>
            {eyebrow && <Reveal className={styles.eyebrow}>{eyebrow}</Reveal>}
            {title && (
              <Reveal as="h2" className={styles.title} delay={60}>
                {title}
              </Reveal>
            )}
            {lede && (
              <Reveal as="p" className={styles.lede} delay={120}>
                {lede}
              </Reveal>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export default Section;
