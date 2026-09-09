import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import Section from '@/components/ui/Section';
import HeroProduct from '@/features/marketing/HeroProduct';
import { useContent } from '@/i18n';
import usePageMeta from '@/lib/utils/usePageMeta';
import styles from './Home.module.css';

export function Home() {
  const { disciplines, process, work, chain } = useContent();
  const { ui } = useContent();
  const c = ui.home;
  const common = ui.common;

  usePageMeta({ title: c.title, description: c.description });

  return (
    <main id="main">
      {/* --- Hero ---------------------------------------------------------- */}
      <section className={styles.hero}>
        <HeroProduct className={styles.heroCanvas} />

        <div className={'u-shell ' + styles.heroInner}>
          <Reveal className="u-label" shift="0.5rem">
            {c.eyebrow}
          </Reveal>

          <Reveal as="h1" className={styles.heroTitle} delay={80}>
            {c.headlineLead} <em>{c.headlineEmphasis}</em>
          </Reveal>

          <Reveal className={styles.heroMeta} delay={180}>
            <p className={styles.heroLede}>{c.lede}</p>
            <Button to="/studio" variant="accent" size="lg">
              {common.testYourProduct}
            </Button>
          </Reveal>
        </div>

        <span className={styles.scrollCue}>{c.scroll}</span>
      </section>

      {/* --- Flat to formed ------------------------------------------------ */}
      <Section eyebrow={c.chainEyebrow} title={c.chainTitle} tight>
        <div className={styles.chain}>
          {chain.map((step, i) => (
            <Reveal key={step.index} className={styles.chainStep} delay={i * 70}>
              <span className={styles.chainIndex}>{step.index}</span>
              <h3 className={styles.chainTitle}>{step.title}</h3>
              <p className={styles.chainBody}>{step.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --- Studio invitation --------------------------------------------- */}
      <Section className="on-paper" eyebrow={c.inviteEyebrow} tight>
        <div className={styles.invite}>
          <div>
            <Reveal as="h2" className={styles.inviteTitle}>
              {c.inviteTitle}
            </Reveal>
            <Reveal as="p" className={styles.inviteBody} delay={80}>
              {c.inviteBody}
            </Reveal>
            <Reveal delay={140}>
              <Button to="/studio" variant="primary" size="lg">
                {common.openStudio}
              </Button>
            </Reveal>
          </div>

          <Reveal className={styles.inviteFrame} delay={120}>
            <HeroProduct className={styles.frameCanvas} />
          </Reveal>
        </div>
      </Section>

      {/* --- Disciplines ---------------------------------------------------- */}
      <Section eyebrow={c.disciplinesEyebrow} title={c.disciplinesTitle}>
        <div className={styles.disciplines}>
          {disciplines.map((discipline, i) => (
            <Reveal key={discipline.id} className={styles.discipline} delay={i * 60}>
              <span className={styles.disciplineIndex}>{discipline.index}</span>
              <h3 className={styles.disciplineTitle}>{discipline.title}</h3>
              <div className={styles.disciplineBody}>
                <p className={styles.disciplineSummary}>{discipline.summary}</p>
                <ul className={styles.disciplineList}>
                  {discipline.detail.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --- Selected work --------------------------------------------------- */}
      <Section eyebrow={c.workEyebrow} title={c.workTitle} lede={c.workLede}>
        <div className={styles.workGrid}>
          {work.slice(0, 4).map((item, i) => (
            <Reveal key={item.id} className={styles.workCard} delay={i * 60}>
              <div className={styles.workTop}>
                <span>{item.discipline}</span>
                <span>{item.year}</span>
              </div>
              <div>
                <h3 className={styles.workTitle}>{item.title}</h3>
                <p className={styles.workBody} style={{ marginTop: 'var(--space-3)' }}>
                  {item.body}
                </p>
              </div>
              <span className={styles.workMetric}>{item.metric}</span>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} style={{ marginTop: 'var(--space-6)' }}>
          <Button to="/work">{common.seeAllWork}</Button>
        </Reveal>
      </Section>

      {/* --- Process --------------------------------------------------------- */}
      <Section eyebrow={c.processEyebrow} title={c.processTitle} tight>
        <div className={`${styles.chain} ${styles.chainFive}`}>
          {process.map((step, i) => (
            <Reveal key={step.step} className={styles.chainStep} delay={i * 60}>
              <span className={styles.chainIndex}>{step.step}</span>
              <h3 className={styles.chainTitle}>{step.title}</h3>
              <p className={styles.chainBody}>{step.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>
    </main>
  );
}

export default Home;
