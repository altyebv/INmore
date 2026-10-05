import Button from '@/components/ui/Button';
import Plates from '@/components/ui/Plates';
import Reveal from '@/components/ui/Reveal';
import Section from '@/components/ui/Section';
import { useContent } from '@/i18n';
import usePageMeta from '@/lib/utils/usePageMeta';
import page from './Capabilities.module.css';
import styles from './Digital.module.css';

/**
 * The digital practice.
 *
 * The counterpart to the print page, and built from the same parts — masthead,
 * hairline grid, numbered cards — so the two read as halves of one house. What
 * is its own is the middle section: the list of things that are one decision
 * made twice, once on paper and once on a screen. That is the argument for
 * buying both from the same people.
 */
export function Digital() {
  const { company, digitalServices, digitalProcess, surfaces, ui } = useContent();
  const c = ui.digital;
  const common = ui.common;

  usePageMeta({ title: c.title, description: c.description });

  return (
    <main id="main" className={page.page}>
      <div className={'u-shell ' + page.masthead}>
        <Reveal className={styles.mark}>
          <Plates kind="rgb" />
          <span className="u-label">{c.eyebrow}</span>
        </Reveal>
        <Reveal as="h1" className={page.title} delay={70}>
          {c.heading}
        </Reveal>
        <Reveal as="p" className={page.lede} delay={130}>
          {c.lede}
        </Reveal>
        <Reveal className={styles.actions} delay={190}>
          <Button to="/contact" variant="accent" size="lg">
            {common.startDigital}
          </Button>
          <Button href={company.whatsapp} size="lg" target="_blank" rel="noopener noreferrer">
            {common.whatsapp}
          </Button>
        </Reveal>
      </div>

      <Section eyebrow={c.servicesEyebrow} title={c.servicesTitle} tight>
        <div className={styles.services}>
          {digitalServices.map((service, i) => (
            <Reveal key={service.id} as="article" className={page.card} delay={i * 50}>
              <span className={page.cardIndex}>{service.index}</span>
              <h3 className={styles.serviceTitle}>{service.title}</h3>
              <p className={page.cardBody}>{service.summary}</p>
              <ul className={page.cardList}>
                {service.detail.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}

          <Reveal className={`${page.card} ${styles.cta}`} delay={digitalServices.length * 50}>
            <Plates kind="rgb" />
            <div className={styles.ctaCopy}>
              <h3 className={styles.serviceTitle}>{c.ctaTitle}</h3>
              <p className={page.cardBody}>{c.ctaBody}</p>
            </div>
            <div>
              <Button to="/contact" variant="accent">
                {common.startDigital}
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section
        className="on-paper"
        eyebrow={c.surfacesEyebrow}
        title={c.surfacesTitle}
        lede={c.surfacesLede}
      >
        <div className={styles.pairs}>
          <Reveal className={`${styles.pair} ${styles.pairHead}`}>
            <span className={styles.pairLabel}>
              <Plates kind="cmyk" />
              {c.printLabel}
            </span>
            <span className={styles.pairLabel}>
              <Plates kind="rgb" />
              {c.digitalLabel}
            </span>
          </Reveal>

          {surfaces.map((pair, i) => (
            <Reveal key={pair.print} className={styles.pair} delay={i * 50}>
              <span>{pair.print}</span>
              <span>{pair.digital}</span>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240} style={{ marginTop: 'var(--space-7)' }}>
          <Button to="/capabilities">{ui.capabilities.eyebrow}</Button>
        </Reveal>
      </Section>

      <Section eyebrow={c.processEyebrow} title={c.processTitle} tight>
        <div className={styles.steps}>
          {digitalProcess.map((step, i) => (
            <Reveal key={step.step} className={page.card} delay={i * 50}>
              <span className={page.cardIndex}>{step.step}</span>
              <h3 className={styles.serviceTitle}>{step.title}</h3>
              <p className={page.cardBody}>{step.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className={styles.actions} delay={280} style={{ marginTop: 'var(--space-7)' }}>
          <Button to="/contact" variant="primary" size="lg">
            {common.startDigital}
          </Button>
          <Button href={company.whatsapp} size="lg" target="_blank" rel="noopener noreferrer">
            {common.whatsapp}
          </Button>
        </Reveal>
      </Section>
    </main>
  );
}

export default Digital;
