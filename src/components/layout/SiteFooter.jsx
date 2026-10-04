import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import cx from '@/lib/utils/cx';
import Logo from '@/components/ui/Logo';
import Signature from '@/components/ui/signature/Signature';
import { useContent } from '@/i18n';
import styles from './SiteFooter.module.css';

/** How long the signature takes to write itself, start to finish. */
const SIGNATURE_MS = 1900;

/**
 * The developer's signature, which writes itself again when pointed at.
 *
 * At rest it is simply there, fully drawn. `Signature` only knows how to draw
 * once, from mount, so each replay is a fresh mount: the key changes, the new
 * copy starts blank and inks itself in. A pointer that wanders back mid-stroke
 * is ignored rather than restarting the hand halfway through a letter.
 */
function FooterSignature() {
  const [plays, setPlays] = useState(0);
  const writing = useRef(null);

  useEffect(() => () => clearTimeout(writing.current), []);

  const write = () => {
    if (writing.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPlays((n) => n + 1);
    writing.current = setTimeout(() => {
      writing.current = null;
    }, SIGNATURE_MS + 150);
  };

  return (
    <span className={styles.credit} onPointerEnter={write}>
      <Signature
        key={plays}
        uid="footer-signature"
        run={plays > 0}
        duration={SIGNATURE_MS}
        className={styles.signature}
      />
    </span>
  );
}

export function SiteFooter() {
  const { company, footerColumns } = useContent();

  return (
    <footer className={styles.footer}>
      <div className={cx('u-shell')}>
        <div className={styles.top}>
          <div className={styles.lead}>
            <Logo height={72} title={company.legalName} />
            <p className={styles.statement}>{company.statement}</p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className={styles.column} aria-label={column.title}>
              <h2 className={styles.columnTitle}>{column.title}</h2>
              {column.items.map((item) =>
                item.to ? (
                  <Link key={item.label} className={styles.item} to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    className={cx(styles.item, 'u-ltr')}
                    href={item.href}
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                )
              )}
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} {company.legalName}
          </span>
          <span>{company.location}</span>
          <FooterSignature />
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
