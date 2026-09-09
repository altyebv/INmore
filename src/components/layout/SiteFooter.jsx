import { Link } from 'react-router-dom';
import cx from '@/lib/utils/cx';
import { useContent } from '@/i18n';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  const { company, footerColumns } = useContent();

  return (
    <footer className={styles.footer}>
      <div className={cx('u-shell')}>
        <div className={styles.top}>
          <p className={styles.statement}>{company.statement}</p>

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
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
