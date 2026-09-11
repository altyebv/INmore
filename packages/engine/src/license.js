import { createContext, useContext } from 'react';

/**
 * The licensing seam.
 *
 * No auth service, no network call, no enforcement — an interface and a
 * permissive implementation, so that the shape of the eventual check exists
 * before there is anything to check against. Adding it later would mean
 * threading a new concern through components that had been written as though
 * it did not exist.
 *
 * Two rules that matter more than the interface:
 *
 * - The engine never calls the network. A license implementation may, but it
 *   is supplied by the host, so what it talks to is the host's decision and
 *   not a hardcoded address in a bundle sitting on a client's page.
 * - An unlicensed studio still renders. Whatever the commercial answer, a
 *   visitor on a client's live product page should never meet a blank box
 *   because a key expired. The state is soft: the studio works, and the thing
 *   that produces a deliverable is what holds back.
 *
 * @typedef {Object} License
 * @property {'ok'|'unlicensed'|'checking'} state
 * @property {string} [tenant]   Resolved tenant key, once known.
 * @property {string} [reason]   Why, when the state is unlicensed.
 */

/** Always yes. The only implementation there is, and the default. */
export const permissiveLicense = { state: 'ok' };

/**
 * Build a license from a tenant key and a list of domains it is licensed for.
 *
 * Local implementation of the eventual check, kept deliberately naive: it
 * compares the page's hostname against an allowlist, which any visitor could
 * defeat with devtools. That is fine — this is not a security boundary, and
 * treating it as one would be the mistake. It exists so a misconfigured embed
 * on the wrong domain is visible to the people running it.
 */
export function domainLicense({ tenant, domains, hostname }) {
  const host =
    hostname ?? (typeof window === 'undefined' ? '' : window.location.hostname);

  if (!domains?.length) return { state: 'ok', tenant };

  const allowed = domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );

  return allowed
    ? { state: 'ok', tenant }
    : { state: 'unlicensed', tenant, reason: `${host} is not licensed for ${tenant}.` };
}

const LicenseContext = createContext(permissiveLicense);

export const LicenseProvider = LicenseContext.Provider;

/**
 * What the current license permits.
 *
 * `unlicensed` is the only thing components should branch on, and only to hold
 * back a deliverable — never to refuse to render.
 */
export function useLicense() {
  const license = useContext(LicenseContext) ?? permissiveLicense;
  return { ...license, unlicensed: license.state === 'unlicensed' };
}

export default useLicense;
