import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useContent } from '@/i18n';
import usePageMeta from '@/lib/utils/usePageMeta';
import styles from './Work.module.css';

export function Work() {
  const { work, ui } = useContent();
  const c = ui.work;

  usePageMeta({ title: c.title, description: c.description });

  return (
    <main id="main" className={styles.page}>
      <div className={'u-shell ' + styles.masthead}>
        <Reveal className="u-label">{c.eyebrow}</Reveal>
        <Reveal as="h1" className={styles.title} delay={70}>
          {c.heading}
        </Reveal>
        <Reveal as="p" className={styles.lede} delay={130}>
          {c.lede}
        </Reveal>
      </div>

      <div className="u-shell">
        <div className={styles.list}>
          {work.map((item, i) => (
            <Reveal key={item.id} className={styles.entry} delay={i * 60}>
              <span className={styles.client}>{item.client}</span>
              <div>
                <h2 className={styles.entryTitle}>{item.title}</h2>
                <p className={styles.entryBody}>{item.body}</p>
              </div>
              <div className={styles.entryMeta}>
                <span className={styles.metric}>{item.metric}</span>
                <span>{item.discipline}</span>
                <span>{item.year}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className={styles.note}>
          <h2 className={styles.noteTitle}>{c.noteTitle}</h2>
          <p className={styles.noteBody}>{c.noteBody}</p>
          <div>
            <Button to="/studio" variant="primary">
              {ui.common.testYourProduct}
            </Button>
          </div>
        </Reveal>

        <div style={{ height: 'clamp(4rem, 8vw, 7rem)' }} />
      </div>
    </main>
  );
}

export default Work;
