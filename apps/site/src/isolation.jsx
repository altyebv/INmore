import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Studio, Button } from '@inmore/engine';
import { inmoreBranding, inmoreCatalogue } from '@/tenant';

/**
 * The isolation harness.
 *
 * Deliberately imports no site stylesheet, no locale provider and no router.
 * That omission is the entire test. The studio's tokens used to live on
 * `:root` in `global.css`, its direction on `<html>`, and its buttons needed a
 * Router above them — so without any of those it rendered as unstyled markup
 * or threw outright, and nobody would have discovered that until it was on a
 * client's page, which is the one place it cannot be fixed quickly.
 *
 * It mounts the real `<Studio>`, not a hand-assembled subset, so what is being
 * proven is the thing that ships.
 *
 * Three slots, because each proves something the previous cannot:
 *
 * 1. INMORE's branding — should look exactly as it does on the site, with the
 *    site's stylesheet absent.
 * 2. A different tenant, to show the brand is data rather than a stylesheet.
 * 3. Arabic, right to left, inside a left-to-right English host page, which
 *    only works because direction moved off `<html>` and onto the studio.
 *
 * Served at /isolation.html in development. Vite builds index.html only, so it
 * does not ship.
 */

/** A second tenant, invented, to prove branding is data and not a stylesheet. */
const otherBranding = {
  ink: '#10243a',
  paper: '#eef3f7',
  accent: '#3ba17c',
  radius: '2px',
};

function Slot({ title, locale = 'en', branding, tenant }) {
  return (
    <section className="harness-slot">
      <h2>{title}</h2>
      <Studio
        tenant={tenant}
        catalogue={inmoreCatalogue}
        branding={branding}
        locale={locale}
        renderCta={({ submit, block, size }) => (
          <Button variant="primary" block={block} size={size} onClick={submit}>
            {locale === 'ar' ? 'اطلب عرض سعر' : 'Request a quote'}
          </Button>
        )}
        onSubmit={(payload) => console.info(`[${tenant}] submit`, payload)}
      />
    </section>
  );
}

createRoot(document.getElementById('harness')).render(
  <StrictMode>
    <Slot
      title="1 — INMORE branding, no site stylesheet"
      tenant="inmore"
      branding={inmoreBranding}
    />
    <Slot title="2 — a different tenant, same engine" tenant="other" branding={otherBranding} />
    <Slot
      title="3 — Arabic, RTL, inside an LTR host page"
      tenant="inmore-ar"
      locale="ar"
      branding={inmoreBranding}
    />
  </StrictMode>
);
