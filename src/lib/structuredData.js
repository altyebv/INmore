import en from '@/i18n/content/en';
import ar from '@/i18n/content/ar';
import { SITE_URL } from '@/lib/site';

/**
 * What the business is, said in the vocabulary search engines read
 * (schema.org). The build writes this into every prerendered page.
 *
 * Contact details come from the content modules so the page and the markup
 * cannot disagree. The alternate names are how a search for the Arabic name —
 * written with or without the space — is tied to the same business.
 */

const tel = (number) => number.replace(/\s/g, '');

const business = {
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: en.company.name,
  legalName: en.company.legalName,
  alternateName: [
    'إن مور',
    'إنمور',
    ar.company.legalName,
    'INMORE For Advertising & Promotion',
  ],
  description: en.ui.home.description,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon-512.png`,
  image: `${SITE_URL}/og.png`,
  email: en.company.email,
  telephone: tel(en.company.phones[0]),
  contactPoint: en.company.phones.map((number) => ({
    '@type': 'ContactPoint',
    telephone: tel(number),
    contactType: 'customer service',
    areaServed: 'QA',
    availableLanguage: ['English', 'Arabic'],
  })),
  address: {
    '@type': 'PostalAddress',
    streetAddress: en.company.address[0],
    addressLocality: 'Doha',
    addressRegion: 'Al Gharrafa',
    addressCountry: 'QA',
  },
  hasMap: en.company.mapUrl,
  sameAs: [en.company.instagram],
  areaServed: { '@type': 'Country', name: 'Qatar' },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '10:00',
      closes: '22:00',
    },
  ],
};

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: en.company.name,
  alternateName: ['إن مور', en.company.legalName],
  url: `${SITE_URL}/`,
  inLanguage: ['en', 'ar'],
  publisher: { '@id': business['@id'] },
};

export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [business, website],
};

export default structuredData;
