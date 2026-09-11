import { forwardRef, useMemo } from 'react';
import cx from './utils/cx';
import styles from './StudioRoot.module.css';

/**
 * The element the studio owns, and the boundary of everything it styles.
 *
 * The studio's class names were always scoped by CSS modules, so they could
 * not leak out. Its *tokens* were not: some seventy custom properties lived on
 * `:root` in the site's stylesheet, and the studio read forty of them. Mounted
 * anywhere that stylesheet was not, every colour, size and spacing resolved to
 * nothing.
 *
 * So the tokens moved here, onto this element, and a tenant's branding is
 * written over them as inline custom properties. Two consequences worth
 * knowing:
 *
 * - Two studios on one page can be branded differently, because the properties
 *   are on an element rather than the document.
 * - The locale's typographic retuning is keyed off `data-locale` on this
 *   element instead of `:root[lang]`, so an Arabic studio works inside an
 *   English host page — and `dir` is set here rather than on `<html>`, which
 *   the studio has no business touching.
 *
 * Branding is deliberately a handful of decisions rather than a full palette.
 * A tenant that supplies three colours should get a coherent studio, not three
 * correct colours and forty wrong ones, so the rest is derived in CSS.
 *
 * @typedef {Object} Branding
 * @property {string} [ink]      Darkest surface. The studio's ground.
 * @property {string} [paper]    Lightest surface, and the text colour on ink.
 * @property {string} [accent]   Selection, focus and emphasis.
 * @property {string} [font]     Body and heading stack.
 * @property {string} [fontMono] Measurements, labels, hex values.
 * @property {string} [fontArabic] Used when the locale is Arabic.
 * @property {string} [radius]   Corner rounding for panels and cards.
 * @property {string} [maxWidth] Widest the studio's content will lay out.
 * @property {Record<string, string>} [tokens] Raw custom properties, applied
 *   last. The escape hatch for a client whose brand is a designed ramp rather
 *   than three colours and a rule — INMORE's greys are hand-picked and no
 *   derivation reproduces them exactly. Keys are written verbatim, so this can
 *   set anything the stylesheet defines. Most tenants should not need it.
 *
 * @param {{
 *   branding?: Branding,
 *   locale?: string,
 *   dir?: 'ltr'|'rtl',
 *   insetBlockStart?: string,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export const StudioRoot = forwardRef(function StudioRoot(
  {
    branding,
    locale = 'en',
    dir = 'ltr',
    insetBlockStart,
    className,
    children,
    ...rest
  },
  ref
) {
  /*
   * Only properties the tenant actually set are written. An undefined entry
   * must not reach the style object as `undefined`, or it overrides the
   * stylesheet default with nothing.
   */
  const style = useMemo(() => {
    const b = branding ?? {};
    const vars = {
      '--studio-ink': b.ink,
      '--studio-paper': b.paper,
      '--studio-accent': b.accent,
      '--studio-font': b.font,
      '--studio-font-mono': b.fontMono,
      '--studio-font-arabic': b.fontArabic,
      '--radius-lg': b.radius,
      '--studio-max': b.maxWidth,
      '--studio-inset-block-start': insetBlockStart,
    };

    const named = Object.entries(vars).filter(
      ([, value]) => value != null && value !== ''
    );

    // Raw overrides last: a tenant that names a token means that token.
    const raw = Object.entries(b.tokens ?? {}).filter(([, value]) => value != null);

    return Object.fromEntries([...named, ...raw]);
  }, [branding, insetBlockStart]);

  return (
    <div
      ref={ref}
      className={cx(styles.root, className)}
      data-studio-root=""
      data-locale={locale}
      dir={dir}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * The scoped replacements for what used to be global `.u-*` utilities.
 *
 * Exported as an object rather than left in the stylesheet so components can
 * reach them by name — `studioUtils.label` where they previously wrote
 * `"u-label"` — and so that moving this package cannot silently drop a class
 * that happened to still be defined somewhere in a host page.
 */
export const studioUtils = {
  label: styles.label,
  ltr: styles.ltr,
  visuallyHidden: styles.visuallyHidden,
  shell: styles.shell,
};

export default StudioRoot;
