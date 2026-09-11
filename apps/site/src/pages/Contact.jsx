import { useState } from 'react';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useContent, useLocalizedCatalogue } from '@/i18n';
import { inmoreCatalogue } from '@/tenant';
import usePageMeta from '@/lib/utils/usePageMeta';
import styles from './Contact.module.css';

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT;

/**
 * Enquiry form.
 *
 * There is no backend yet, and the site does not pretend otherwise: the form
 * composes a complete, well-structured email the visitor sends themselves.
 * The moment a real endpoint exists, setting VITE_CONTACT_ENDPOINT switches it
 * to a normal POST without touching the markup or the fields.
 */
export function Contact() {
  const { company, ui } = useContent();
  const catalogue = useLocalizedCatalogue(inmoreCatalogue.all);
  const c = ui.contact;

  usePageMeta({ title: c.title, description: c.description });

  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    if (ENDPOINT) {
      setSending(true);
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        setStatus(response.ok ? c.sent : c.failed);
      } catch {
        setStatus(c.failed);
      } finally {
        setSending(false);
      }
      return;
    }

    const body = [
      `Name: ${data.name}`,
      `Company: ${data.company || '—'}`,
      `Email: ${data.email}`,
      `Product: ${data.product}`,
      `Quantity: ${data.quantity || '—'}`,
      '',
      data.message,
    ].join('\n');

    window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(
      `${c.subject} — ${data.company || data.name}`
    )}&body=${encodeURIComponent(body)}`;

    setStatus(c.mailtoOpened);
  };

  return (
    <main id="main" className={styles.page}>
      <div className={'u-shell ' + styles.layout}>
        <div>
          <Reveal className="u-label">{c.eyebrow}</Reveal>
          <Reveal as="h1" className={styles.title} delay={70}>
            {c.heading}
          </Reveal>
          <Reveal as="p" className={styles.lede} delay={130}>
            {c.lede}
          </Reveal>

          <Reveal className={styles.details} delay={190}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>{c.emailLabel}</span>
              <a className={`${styles.detailValue} u-ltr`} href={`mailto:${company.email}`}>
                {company.email}
              </a>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>{c.phoneLabel}</span>
              <a
                className={`${styles.detailValue} u-ltr`}
                href={`tel:${company.phone.replace(/\s/g, '')}`}
              >
                {company.phone}
              </a>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>{c.studioLabel}</span>
              <span className={styles.detailValue}>{company.address.join('، ')}</span>
            </div>
          </Reveal>
        </div>

        <Reveal as="form" className={styles.form} delay={100} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                {c.fields.name}
              </label>
              <input className={styles.input} id="name" name="name" required autoComplete="name" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="company">
                {c.fields.company}
              </label>
              <input
                className={styles.input}
                id="company"
                name="company"
                autoComplete="organization"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              {c.fields.email}
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="product">
                {c.fields.product}
              </label>
              <select className={styles.select} id="product" name="product" defaultValue="">
                <option value="">{c.fields.productUnsure}</option>
                {catalogue.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.name}
                  </option>
                ))}
                <option value="Other">{c.fields.productOther}</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="quantity">
                {c.fields.quantity}
              </label>
              <input
                className={styles.input}
                id="quantity"
                name="quantity"
                inputMode="numeric"
                placeholder={c.fields.quantityPlaceholder}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="message">
              {c.fields.message}
            </label>
            <textarea className={styles.textarea} id="message" name="message" required />
          </div>

          <Button as="button" type="submit" variant="primary" block disabled={sending}>
            {sending ? c.sending : c.submit}
          </Button>

          {status && (
            <p className={styles.status} role="status">
              {status}
            </p>
          )}

          {!ENDPOINT && (
            <p className={styles.hint}>{c.noBackendHint}</p>
          )}
        </Reveal>
      </div>
    </main>
  );
}

export default Contact;
