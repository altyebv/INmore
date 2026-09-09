import cx from '@/lib/utils/cx';
import { LOCALES, useLocale } from '@/i18n';
import styles from './LanguageToggle.module.css';

/**
 * Language switch.
 *
 * Shown as two visible options rather than a single "switch to X" button: a
 * bilingual visitor can see at a glance which language they are in and which
 * one is available, and the control does not change meaning as they use it.
 * Each option is labelled in its own language and script.
 */
export function LanguageToggle({ className }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={cx(styles.toggle, className)} role="group" aria-label={t.common.language}>
      {Object.values(LOCALES).map((option) => (
        <button
          key={option.code}
          type="button"
          className={cx(styles.option, option.code === 'ar' && styles.arabic)}
          lang={option.htmlLang}
          aria-pressed={option.code === locale}
          aria-label={option.label}
          onClick={() => setLocale(option.code)}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

export default LanguageToggle;
