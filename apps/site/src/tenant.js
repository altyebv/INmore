import { createCatalogue } from '@inmore/engine';
import { assertValidTenantConfig } from '@inmore/config-schema';
import config from '../../../tenants/inmore.json';

/**
 * Who this site is for.
 *
 * Everything client-specific is now one JSON file, validated at load. This
 * module is what turns it into the shapes the studio takes as props, and it is
 * deliberately almost nothing — because the point of the extraction is that
 * onboarding a client means writing a config, not writing a module.
 *
 * `assertValidTenantConfig` throws on a bad config, by design. A tenant config
 * is edited by hand and decides whether a client's studio works at all;
 * failing at load with every problem named and located is the difference
 * between a five-minute fix and someone staring at a black screen wondering
 * which of forty numbers is wrong.
 *
 * The import is static so the config is bundled and validated at build time —
 * a broken config fails the build rather than the page. An embed will fetch
 * its tenant instead, which is the same three lines with an await in them.
 */

const tenant = assertValidTenantConfig(config, { label: 'tenants/inmore.json' });

export const inmoreTenant = tenant.tenant;
export const inmoreLocales = tenant.locales;
export const inmoreAssetBase = tenant.assetBase;
export const inmoreBranding = tenant.branding;

export const inmoreCatalogue = createCatalogue({
  products: tenant.products,
  stocks: tenant.stocks,
});

export default inmoreCatalogue;
