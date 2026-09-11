import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import cx from '@/lib/utils/cx';
import Button from '@/components/ui/Button';
import Wordmark from '@/components/ui/Wordmark';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useContent, useT } from '@/i18n';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const { nav } = useContent();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className={cx(styles.header, (scrolled || open) && styles.scrolled)}>
      <div className={cx('u-shell', styles.inner)}>
        <NavLink to="/" className={styles.brand} aria-label={t.common.home}>
          <Wordmark height={16} />
        </NavLink>

        <nav
          id="primary-navigation"
          className={cx(styles.nav, open && styles.navOpen)}
          aria-label="Primary"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx(styles.link, isActive && styles.active)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <LanguageToggle />
          <Button to="/studio" variant="primary" size="sm" className={styles.desktopAction}>
            {t.common.testYourProduct}
          </Button>
          <Button
            className={styles.toggle}
            variant="ghost"
            size="sm"
            icon
            aria-expanded={open}
            aria-controls="primary-navigation"
            aria-label={open ? t.common.closeMenu : t.common.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
              {open ? (
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.4" />
              ) : (
                <path d="M2 6h14M2 12h14" stroke="currentColor" strokeWidth="1.4" />
              )}
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
