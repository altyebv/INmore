import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useContent, useLocalizedCatalogue } from '@/i18n';
import catalogue from '@/catalogue';
import usePageMeta from '@/lib/utils/usePageMeta';
import { describeDesign, isOrderingEnabled, placeOrder } from '@/lib/orders';
import form from './Contact.module.css';
import styles from './Order.module.css';

/** The select's value for a product that is not in the catalogue. */
const OTHER = 'other';
const MAX_LINES = 20;

/**
 * The order form.
 *
 * No account and no sign-in: a name and a mobile number, which is how INMORE
 * knows its customers everywhere else. The order lands in the operations
 * system as a new request and a person calls back to confirm it, so nothing
 * here quotes a price or takes a payment.
 *
 * A visitor arriving from the studio brings their design with them in the
 * route's state; it becomes the first line of the order.
 */
export function Order() {
  const { ui } = useContent();
  const o = ui.order;
  const products = useLocalizedCatalogue(catalogue.live);
  const location = useLocation();
  const navigate = useNavigate();

  usePageMeta({ title: o.title, description: o.description });

  const [design, setDesign] = useState(location.state?.design ?? null);
  const nextKey = useRef(1);
  const [lines, setLines] = useState(() => [firstLine(design)]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  // The confirmation is much shorter than the form it replaces, so without
  // this the visitor is left looking at the footer.
  const confirmation = useRef(null);
  useEffect(() => {
    if (done) confirmation.current?.scrollIntoView({ block: 'center' });
  }, [done]);

  const update = (key, changes) =>
    setLines((all) => all.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  const addLine = () =>
    setLines((all) => [...all, { key: nextKey.current++, product: '', name: '', quantity: '' }]);
  const removeLine = (key) => setLines((all) => all.filter((line) => line.key !== key));

  const removeDesign = () => {
    setDesign(null);
    setLines((all) => all.map(({ designed, ...line }) => line));
  };

  const toItem = (line) => {
    const product = catalogue.live.find((p) => p.id === line.product);
    return {
      // Sent in English whatever the visitor reads: staff see this name.
      ...(product ? { sku: product.id, name: product.name.en } : { name: line.name }),
      quantity: line.quantity,
      specs: line.designed ? describeDesign(design) : undefined,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    const data = Object.fromEntries(new FormData(event.currentTarget));
    // A field no person can see. Anything that fills it in is not a customer.
    if (data.website) return;

    setError(null);
    setSending(true);
    try {
      const { number } = await placeOrder({
        name: data.name,
        mobile: data.mobile,
        company: data.company,
        notes: data.notes,
        items: lines.map(toItem),
      });
      setDone({ number, mobile: data.mobile });
      // The design has been ordered; a reload should not bring it back.
      navigate('/order', { replace: true, state: null });
    } catch (failure) {
      if (import.meta.env.DEV) console.warn('[order]', failure);
      setError(o.errors[failure.code] ?? o.errors.failed);
    } finally {
      setSending(false);
    }
  };

  const startAgain = () => {
    setDone(null);
    setDesign(null);
    setLines([{ key: nextKey.current++, product: '', name: '', quantity: '' }]);
  };

  return (
    <main id="main" className={form.page}>
      <div className={'u-shell ' + form.layout}>
        <div>
          <Reveal className="u-label">{o.eyebrow}</Reveal>
          <Reveal as="h1" className={form.title} delay={70}>
            {o.heading}
          </Reveal>
          <Reveal as="p" className={form.lede} delay={130}>
            {o.lede}
          </Reveal>

          <Reveal className={form.details} delay={190}>
            <span className={form.detailLabel}>{o.stepsTitle}</span>
            <ol className={styles.steps}>
              {o.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Reveal>
        </div>

        {done ? (
          <div ref={confirmation} className={form.form} role="status">
            <p className="u-label">{o.done.eyebrow}</p>
            <h2 className={styles.doneHeading}>{o.done.heading}</h2>
            <div className={form.detail}>
              <span className={form.detailLabel}>{o.done.number}</span>
              <span className={`${styles.number} u-ltr`}>#{done.number}</span>
            </div>
            <p className={form.lede}>
              {o.done.bodyBefore}
              <span className="u-ltr">{done.mobile}</span>
              {o.done.bodyAfter}
            </p>
            <div className={styles.doneActions}>
              <Button to="/" variant="primary">
                {o.done.home}
              </Button>
              <Button onClick={startAgain}>{o.done.another}</Button>
            </div>
          </div>
        ) : (
          <Reveal as="form" className={form.form} delay={100} onSubmit={handleSubmit}>
            <div className={form.row}>
              <div className={form.field}>
                <label className={form.label} htmlFor="name">
                  {o.fields.name}
                </label>
                <input
                  className={form.input}
                  id="name"
                  name="name"
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
              <div className={form.field}>
                <label className={form.label} htmlFor="mobile">
                  {o.fields.mobile}
                </label>
                <input
                  className={form.input}
                  id="mobile"
                  name="mobile"
                  type="tel"
                  dir="ltr"
                  required
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="5555 1234"
                  aria-describedby="mobile-hint"
                />
              </div>
            </div>
            <p className={form.hint} id="mobile-hint">
              {o.fields.mobileHint}
            </p>

            <div className={form.field}>
              <label className={form.label} htmlFor="company">
                {o.fields.company}
              </label>
              <input
                className={form.input}
                id="company"
                name="company"
                maxLength={120}
                autoComplete="organization"
              />
            </div>

            {design && (
              <div className={styles.design}>
                {design.previews?.thumbnail && (
                  <img className={styles.designThumb} src={design.previews.thumbnail} alt="" />
                )}
                <div className={styles.designBody}>
                  <span className={form.detailLabel}>{o.design.title}</span>
                  <p className={styles.designNote}>{o.design.note}</p>
                  <button type="button" className={styles.textButton} onClick={removeDesign}>
                    {o.design.remove}
                  </button>
                </div>
              </div>
            )}

            <fieldset className={styles.lines}>
              <legend className={form.label}>{o.fields.items}</legend>

              {lines.map((line, index) => (
                <div key={line.key} className={styles.line}>
                  <div className={form.field}>
                    <label className="u-visually-hidden" htmlFor={`product-${line.key}`}>
                      {o.fields.product} {index + 1}
                    </label>
                    <select
                      className={form.select}
                      id={`product-${line.key}`}
                      required
                      value={line.product}
                      onChange={(event) => update(line.key, { product: event.target.value })}
                    >
                      <option value="" disabled>
                        {o.fields.productChoose}
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                      <option value={OTHER}>{o.fields.productOther}</option>
                    </select>
                  </div>

                  <div className={form.field}>
                    <label className="u-visually-hidden" htmlFor={`quantity-${line.key}`}>
                      {o.fields.quantity} {index + 1}
                    </label>
                    <input
                      className={form.input}
                      id={`quantity-${line.key}`}
                      inputMode="numeric"
                      required
                      maxLength={12}
                      placeholder={o.fields.quantityPlaceholder}
                      value={line.quantity}
                      onChange={(event) => update(line.key, { quantity: event.target.value })}
                    />
                  </div>

                  {lines.length > 1 && (
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`${o.removeItem} ${index + 1}`}
                      onClick={() => removeLine(line.key)}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </button>
                  )}

                  {line.product === OTHER && (
                    <input
                      className={`${form.input} ${styles.otherName}`}
                      required
                      maxLength={120}
                      aria-label={o.fields.otherName}
                      placeholder={o.fields.otherName}
                      value={line.name}
                      onChange={(event) => update(line.key, { name: event.target.value })}
                    />
                  )}
                </div>
              ))}

              {lines.length < MAX_LINES && (
                <button type="button" className={styles.textButton} onClick={addLine}>
                  + {o.addItem}
                </button>
              )}
            </fieldset>

            <div className={form.field}>
              <label className={form.label} htmlFor="notes">
                {o.fields.notes}
              </label>
              <textarea
                className={form.textarea}
                id="notes"
                name="notes"
                maxLength={2000}
                placeholder={o.fields.notesPlaceholder}
              />
            </div>

            <input
              className={styles.trap}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <Button
              as="button"
              type="submit"
              variant="primary"
              block
              disabled={sending || !isOrderingEnabled}
            >
              {sending ? o.sending : o.submit}
            </Button>

            {error && (
              <p className={form.status} role="alert">
                {error}
              </p>
            )}

            {!isOrderingEnabled && <p className={form.hint}>{o.errors.unavailable}</p>}
          </Reveal>
        )}
      </div>
    </main>
  );
}

/** The studio's product, when the visitor came from there; otherwise a blank line. */
function firstLine(design) {
  const blank = { key: 0, product: '', name: '', quantity: '' };
  if (!design) return blank;
  const known = catalogue.live.some((product) => product.id === design.sku);
  return {
    ...blank,
    designed: true,
    product: known ? design.sku : OTHER,
    name: known ? '' : String(design.sku ?? ''),
  };
}

export default Order;
