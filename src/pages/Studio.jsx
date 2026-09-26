import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudioEmbed from '@/features/studio/StudioEmbed';
import cx from '@/lib/utils/cx';
import usePageMeta from '@/lib/utils/usePageMeta';
import useMediaQuery from '@/lib/utils/useMediaQuery';
import { useContent, useLocale } from '@/i18n';
import { useAppShell } from '@/app/ShellContext';
import catalogue from '@/catalogue';
import styles from './Studio.module.css';

/**
 * The studio page.
 *
 * The configurator lives in its own repo (Qreate) and this page hosts it
 * through the embed, the way any client's page would: deciding what the studio
 * is for here, naming a tenant, and saying what happens when a visitor
 * finishes.
 *
 * What stays here is genuinely the site's:
 *
 * - the page's title and description, which are this site's metadata
 * - the heading and lede above the studio, which are marketing copy
 * - what happens on submit, because only this app knows there is a contact page
 * - whether the studio owns the viewport, which only the page can know
 */

/** Below this the studio takes the whole viewport rather than sitting in a page. */
const FULLSCREEN_QUERY = '(max-width: 1080px)';

export function Studio() {
  const { ui } = useContent();
  const t = ui.studio;
  const { locale } = useLocale();
  const navigate = useNavigate();

  const fullscreen = useMediaQuery(FULLSCREEN_QUERY);

  usePageMeta({ title: t.title, description: t.description });
  useAppShell(fullscreen);

  /*
   * The studio reports a finished configuration; where it goes is ours to
   * decide. There is no backend yet, so the payload goes to the console and
   * the visitor goes to the contact page — but the seam is the real one, and
   * the day there is an endpoint this is the only line that changes.
   */
  const handleSubmit = useCallback(
    (payload) => {
      if (import.meta.env.DEV) console.info('[studio] submit', payload);
      navigate('/contact');
    },
    [navigate]
  );

  const configurator = (
    <StudioEmbed
      tenant="inmore"
      sku={catalogue.live[0]?.id}
      locale={locale}
      height={
        fullscreen
          ? 'calc(100svh - var(--header-h))'
          : 'min(760px, calc(100svh - var(--header-h) - 12rem))'
      }
      onSubmit={handleSubmit}
    />
  );

  if (fullscreen) return <main id="main">{configurator}</main>;

  return (
    <main id="main" className={styles.page}>
      <div className={styles.intro}>
        <div className={cx('u-shell', styles.introInner)}>
          <div>
            <p className="u-label">{t.eyebrow}</p>
            <h1 className={styles.title}>{t.heading}</h1>
          </div>
          <p className={styles.lede}>{t.lede}</p>
        </div>
      </div>

      {configurator}
    </main>
  );
}

export default Studio;
