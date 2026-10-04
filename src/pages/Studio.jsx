import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudioEmbed from '@/features/studio/StudioEmbed';
import cx from '@/lib/utils/cx';
import usePageMeta from '@/lib/utils/usePageMeta';
import useMediaQuery from '@/lib/utils/useMediaQuery';
import { localizePath, useContent, useLocale } from '@/i18n';
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
 * - what happens on submit, because only this app knows there is an order page
 * - whether the studio owns the viewport, which only the page can know
 */

/** Below this the studio takes the whole viewport rather than sitting in a page. */
const FULLSCREEN_QUERY = '(max-width: 1080px)';

/**
 * History state has a size limit and a thumbnail is a data URL of no fixed
 * size. A small one is worth showing on the order page; a large one is not
 * worth a failed navigation.
 */
function withoutHeavyPreview(payload) {
  const thumbnail = payload?.previews?.thumbnail;
  if (!thumbnail || thumbnail.length < 400_000) return payload;
  return { ...payload, previews: { ...payload.previews, thumbnail: null } };
}

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
   * decide. It goes to the order page as the first line of an order, carried
   * in the route's state so it survives a reload but never lands in the URL.
   */
  const handleSubmit = useCallback(
    (payload) => {
      if (import.meta.env.DEV) console.info('[studio] submit', payload);
      navigate(localizePath('/order', locale), { state: { design: withoutHeavyPreview(payload) } });
    },
    [navigate, locale]
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

  if (fullscreen) {
    return (
      <main id="main" className={styles.shell}>
        {configurator}
      </main>
    );
  }

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
