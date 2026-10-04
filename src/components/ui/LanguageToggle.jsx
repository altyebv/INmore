import cx from '@/lib/utils/cx';
import { useLocation, useNavigate } from 'react-router-dom';
import { LOCALES, localizePath, useLocale } from '@/i18n';
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
  const location = useLocation();
  const navigate = useNavigate();

  const switchTo = (code) => {
    setLocale(code);
    navigate(localizePath(`${location.pathname}${location.search}${location.hash}`, code));
  };

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
          onClick={() => switchTo(option.code)}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

export default LanguageToggle;
