import Button from '@/components/ui/Button';
import Plates from '@/components/ui/Plates';
import Reveal from '@/components/ui/Reveal';
import Section from '@/components/ui/Section';
import HeroProduct from '@/features/marketing/HeroProduct';
import HeroShowcase from '@/features/marketing/HeroShowcase';
import ProductGallery from '@/features/marketing/ProductGallery';
import { useContent } from '@/i18n';
import catalogue from '@/catalogue';
import usePageMeta from '@/lib/utils/usePageMeta';
import styles from './Home.module.css';

export function Home() {
  const { practices, digitalServices, process, work, chain } = useContent();
  const { ui } = useContent();
  const c = ui.home;
  const common = ui.common;

  usePageMeta({ title: c.title, description: c.description });

  return (
    <main id="main">
      {/* --- Hero ---------------------------------------------------------- */}
      {/* The rail fills the viewport and the copy sits over it. The scrim
          between them is what keeps the headline readable while products pass
          behind it — the depth is the point, so the products are not moved out
          of the way, they are lit through. */}
      <section className={styles.hero}>
        <HeroShowcase products={catalogue.showcase} className={styles.heroCanvas} />
        <div className={styles.heroScrim} aria-hidden="true" />

        <div className={'u-shell ' + styles.heroInner}>
          <div className={styles.heroCopy}>
            <Reveal className="u-label" shift="0.5rem">
              {c.eyebrow}
            </Reveal>

            <Reveal as="h1" className={styles.heroTitle} delay={80}>
              {c.headlineLead} <em>{c.headlineEmphasis}</em>
            </Reveal>

            <Reveal className={styles.heroMeta} delay={180}>
              <p className={styles.heroLede}>{c.lede}</p>
              <div className={styles.heroActions}>
                <Button to="/studio" variant="accent" size="lg">
                  {common.testYourProduct}
                </Button>
                <Button to="/digital" variant="glass" size="lg">
                  {common.digitalServices}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <span className={styles.scrollCue}>{c.scroll}</span>
      </section>

      {/* --- The two practices ---------------------------------------------- */}
      {/* The whole offer in one view: what is held, and what is found. Each
          panel is marked with its own colour model — inks for print, lights
          for screen — and leads to the page that goes into detail. */}
      <Section eyebrow={c.practicesEyebrow} title={c.practicesTitle} lede={c.practicesLede}>
        <div className={styles.practices}>
          {practices.map((practice, i) => (
            <Reveal key={practice.id} className={styles.practice} delay={i * 90}>
              <div className={styles.practiceLabel}>
                <span>{practice.label}</span>
                <Plates kind={practice.plates} />
              </div>
              <h3 className={styles.practiceTitle}>{practice.title}</h3>
              <p className={styles.practiceBody}>{practice.body}</p>
              <ul className={styles.practiceList}>
                {practice.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div>
                <Button to={practice.to}>{practice.cta}</Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

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
            <HeroProduct product={catalogue.live[0]} className={styles.frameCanvas} />
          </Reveal>
        </div>
      </Section>

      {/* --- Digital -------------------------------------------------------- */}
      {/* Seven services and one way in. The eighth cell is the invitation, so
          the grid closes on an action rather than on an empty corner. */}
      <Section eyebrow={c.digitalEyebrow} title={c.digitalTitle} lede={c.digitalLede}>
        <div className={`${styles.chain} ${styles.chainEight}`}>
          {digitalServices.map((service, i) => (
            <Reveal key={service.id} className={styles.chainStep} delay={i * 50}>
              <span className={styles.chainIndex}>{service.index}</span>
              <h3 className={styles.chainTitle}>{service.title}</h3>
              <p className={styles.chainBody}>{service.summary}</p>
            </Reveal>
          ))}

          <Reveal className={`${styles.chainStep} ${styles.chainCta}`} delay={digitalServices.length * 50}>
            <Plates kind="rgb" />
            <h3 className={styles.chainTitle}>{ui.digital.ctaTitle}</h3>
            <p className={styles.chainBody}>{ui.digital.ctaBody}</p>
            <div>
              <Button to="/contact" variant="accent">
                {common.startDigital}
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} style={{ marginTop: 'var(--space-6)' }}>
          <Button to="/digital">{common.digitalServices}</Button>
        </Reveal>
      </Section>

      {/* --- Product range -------------------------------------------------- */}
      <Section className="on-paper" eyebrow={c.galleryEyebrow} title={c.galleryTitle} lede={c.galleryLede}>
        <ProductGallery />
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
