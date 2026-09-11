import { createCatalogue } from '@/products';
import STOCKS from '@/products/stock';
import paperCup from '@/products/paperCup';
import shoppingBag from '@/products/shoppingBag';
import giftBox from '@/products/giftBox';
import mailerPackage from '@/products/mailerPackage';
import upcomingProducts from '@/products/upcoming';

/**
 * Who this site is for.
 *
 * Everything client-specific that the studio consumes is assembled here, in
 * one place, by the application — not reached for from inside a component.
 * That is the whole point: the studio takes a catalogue, it does not import
 * one, so a second client is a second catalogue rather than a second codebase.
 *
 * This module is the seam. In a later phase its contents become
 * `tenants/inmore.json`, validated at load, and this file shrinks to a fetch
 * and a validate. Nothing that consumes `inmoreCatalogue` needs to change when
 * that happens, because what they receive — a built catalogue — is the same
 * either way.
 */

export const inmoreCatalogue = createCatalogue({
  products: [paperCup, shoppingBag, giftBox, mailerPackage, ...upcomingProducts],
  stocks: STOCKS,
});

/**
 * INMORE's brand, as data the studio reads rather than CSS it depends on.
 *
 * Three colours and a few fonts would be enough for most clients — the studio
 * derives its ink and paper ramps from them, so a tenant that supplies little
 * still gets a coherent result rather than three right colours and forty wrong
 * ones.
 *
 * INMORE is not most clients: its greys were chosen by hand and no derivation
 * reproduces them exactly. `tokens` writes them verbatim, which is what keeps
 * the site pixel-identical through this extraction. That it is needed here is
 * the honest answer to "is three colours really enough" — usually yes, and
 * when it is not, the escape hatch is data too.
 */
export const inmoreBranding = {
  ink: '#0b0b0a',
  paper: '#f7f5f1',
  accent: '#e2481f',

  font: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', 'Menlo', monospace",
  fontArabic: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif",

  radius: '10px',
  maxWidth: '88rem',

  tokens: {
    '--ink-800': '#121211',
    '--ink-700': '#1a1a18',
    '--ink-600': '#232320',
    '--ink-500': '#2f2f2b',
    '--ink-400': '#494943',

    '--paper-200': '#ece8e1',
    '--paper-300': '#d9d3c9',
    '--paper-400': '#b4aca0',

    '--accent-soft': '#f26a44',
    '--accent-dim': 'rgba(226, 72, 31, 0.16)',

    '--line': 'rgba(247, 245, 241, 0.11)',
    '--line-strong': 'rgba(247, 245, 241, 0.22)',
    '--fg-muted': 'rgba(247, 245, 241, 0.62)',
    '--fg-faint': 'rgba(247, 245, 241, 0.38)',
  },
};

export default inmoreCatalogue;
