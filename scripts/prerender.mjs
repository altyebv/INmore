/**
 * Prerender every route to its own HTML file, and write the sitemap.
 *
 * Runs after the client and server builds. Each page gets its real content,
 * language, title, description, canonical and hreflang in the HTML itself, so
 * a crawler or a link preview that never runs JavaScript still sees the page
 * it asked for. The browser then hydrates that markup (see src/main.jsx).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const { render, paths, LOCALES, SITE_URL, localizePath, pageUrls } = await import(
  pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href
);

const template = await readFile(join(dist, 'index.html'), 'utf8');

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function headFor(url, { title, description, noindex }) {
  const { canonical, alternates, ogLocale } = pageUrls(url);
  return [
    `<title>${escape(title)}</title>`,
    description && `<meta name="description" content="${escape(description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex' : 'index, follow'}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    ...alternates.map(
      ({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${href}" />`
    ),
    `<meta property="og:title" content="${escape(title)}" />`,
    description && `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:locale" content="${ogLocale}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

async function page(url, file, marker = url) {
  const { html, meta } = await render(url);
  const { locale } = pageUrls(url);
  const { htmlLang, dir, code } = LOCALES[locale];

  const out = template
    .replace(/<html[^>]*>/, `<html lang="${htmlLang}" dir="${dir}" data-locale="${code}">`)
    .replace(/<!--page-meta-->[\s\S]*<!--\/page-meta-->/, () => headFor(url, meta))
    .replace(
      '<div id="root"></div>',
      () => `<div id="root" data-prerendered="${marker}">${html}</div>`
    );

  if (out.includes('<!--page-meta-->') || !out.includes('data-prerendered')) {
    throw new Error(`Prerender: index.html no longer has the markers this script fills (${url}).`);
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, out);
  console.log(`prerendered ${url}`);
}

const urls = paths.flatMap((path) =>
  Object.keys(LOCALES).map((locale) => localizePath(path, locale))
);

for (const url of urls) {
  await page(url, join(dist, url, 'index.html'));
}

// What the host serves for any path that is not a page. Marked so the browser
// renders it fresh rather than hydrating: the URL it lands on is not this one.
await page('/404', join(dist, '404.html'), '*');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map((url) => {
    const { canonical, alternates } = pageUrls(url);
    return `  <url>
    <loc>${canonical}</loc>
${alternates
  .map(({ hreflang, href }) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`)
  .join('\n')}
  </url>`;
  })
  .join('\n')}
</urlset>
`;

await writeFile(join(dist, 'sitemap.xml'), sitemap);
console.log(`sitemap.xml: ${urls.length} URLs on ${SITE_URL}`);
