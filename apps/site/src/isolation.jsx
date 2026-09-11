import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '@/i18n';
import StudioRoot from '@/features/studio/StudioRoot';
import StudioProvider from '@/features/studio/state/StudioProvider';
import ProductPicker from '@/features/studio/components/ProductPicker';
import StockPicker from '@/features/studio/components/StockPicker';
import ArtworkDropzone from '@/features/studio/components/ArtworkDropzone';
import { useStudio } from '@/features/studio/state/StudioProvider';
import { inmoreBranding, inmoreCatalogue } from '@/tenant';

/**
 * The isolation harness.
 *
 * Deliberately does NOT import `@/styles/global.css`. That omission is the
 * entire test: the studio's tokens used to live on `:root` in that file, so
 * without it every colour, size and spacing in the studio resolved to nothing
 * — and nobody would have discovered that until it was mounted on a client's
 * page, which is the one place it could not be fixed quickly.
 *
 * Three slots, because each proves something the previous one cannot:
 *
 * 1. INMORE's own branding, so the studio should look exactly as it does on
 *    the site despite the site's stylesheet being absent.
 * 2. A different tenant, to show the brand is data rather than a stylesheet.
 * 3. Arabic, right to left, inside a left-to-right English host page — which
 *    only works because direction moved off `<html>` and onto the studio.
 *
 * Served at /isolation.html in development. Not part of the production build.
 */

/** Enough of the studio to see whether it is styled, without the 3-D bundle. */
function Panel() {
  const studio = useStudio();
  return (
    <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem' }}>
      <ProductPicker selectedId={studio.product.id} onSelect={studio.selectProduct} />
      <StockPicker
        product={studio.product}
        value={studio.baseColor}
        onChange={studio.setBaseColor}
      />
      <ArtworkDropzone
        artwork={studio.artwork}
        status={studio.status}
        error={studio.error}
        onUpload={studio.uploadArtwork}
        onClear={studio.clearArtwork}
      />
    </div>
  );
}

function Slot({ title, locale = 'en', dir = 'ltr', branding }) {
  return (
    <section className="harness-slot">
      <h2>{title}</h2>
      <LocaleProvider initialLocale={locale} ownsDocument={false}>
        <StudioRoot branding={branding} locale={locale} dir={dir}>
          <StudioProvider catalogue={inmoreCatalogue}>
            <Panel />
          </StudioProvider>
        </StudioRoot>
      </LocaleProvider>
    </section>
  );
}

/** A second tenant, invented, to prove branding is data and not a stylesheet. */
const otherBranding = {
  ink: '#10243a',
  paper: '#eef3f7',
  accent: '#3ba17c',
  radius: '2px',
};

createRoot(document.getElementById('harness')).render(
  <StrictMode>
    <MemoryRouter>
      <Slot title="1 — INMORE branding, no site stylesheet" branding={inmoreBranding} />
      <Slot title="2 — a different tenant, same engine" branding={otherBranding} />
      <Slot
        title="3 — Arabic, RTL, inside an LTR host page"
        locale="ar"
        dir="rtl"
        branding={inmoreBranding}
      />
    </MemoryRouter>
  </StrictMode>
);
