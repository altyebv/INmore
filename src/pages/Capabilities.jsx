import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import Section from '@/components/ui/Section';
import { useContent } from '@/i18n';
import usePageMeta from '@/lib/utils/usePageMeta';
import styles from './Capabilities.module.css';

export function Capabilities() {
  const { capabilitySpecs, disciplines, process, ui } = useContent();
  const c = ui.capabilities;

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
        <div className={styles.grid}>
          {disciplines.map((discipline, i) => (
            <Reveal key={discipline.id} className={styles.card} delay={i * 60}>
              <span className={styles.cardIndex}>{discipline.index}</span>
              <h2 className={styles.cardTitle}>{discipline.title}</h2>
              <p className={styles.cardBody}>{discipline.summary}</p>
              <ul className={styles.cardList}>
                {discipline.detail.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>

      <Section eyebrow={c.specEyebrow} title={c.specTitle}>
        <div className={styles.specs}>
          {capabilitySpecs.map((spec, i) => (
            <Reveal key={spec.label} className={styles.spec} delay={i * 40}>
              <span className={styles.specLabel}>{spec.label}</span>
              <span className={styles.specValue}>{spec.value}</span>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="on-paper" eyebrow={c.processEyebrow} title={c.processTitle} tight>
        <div className={styles.grid}>
          {process.map((step, i) => (
            <Reveal key={step.step} className={styles.card} delay={i * 50}>
              <span className={styles.cardIndex}>{step.step}</span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardBody}>{step.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280} style={{ marginTop: 'var(--space-7)' }}>
          <Button to="/studio" variant="primary" size="lg">
            {c.cta}
          </Button>
        </Reveal>
      </Section>
    </main>
  );
}

export default Capabilities;
