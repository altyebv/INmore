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

export default inmoreCatalogue;
