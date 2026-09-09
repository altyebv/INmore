import { preloadModelAvailability, whenAvailabilityKnown } from './useModelAvailability';
import { preloadGlbModels, whenGlbSettled } from './preloadModels';

/**
 * Warm both caches for a set of products: the HEAD-based availability check
 * and the GLB download itself. Call this once, as early as possible — a
 * carousel calls it on mount so every product's asset is already in flight
 * long before its turn comes up in the rotation.
 */
export function warmProducts(products) {
  preloadModelAvailability(products.map((p) => p.model?.url));
  preloadGlbModels(products);
}

/**
 * Resolves once a product's final on-screen representation is decided:
 * either the HEAD check has confirmed the model is missing (the proxy is the
 * permanent answer, nothing else to wait for) or, once it's known to exist,
 * the GLB download itself has settled.
 *
 * Mirrors `ProductModel`'s own branching (`availability === 'missing' ? proxy
 * : <GLB/>`) so a caller can know in advance which branch will actually
 * render — used to gate a reveal so it never lands on the moment
 * `ProductModel` is still deciding what to show.
 */
export async function whenProductReady(product) {
  const url = product?.model?.url;
  if (!url) return; // proxy-only product — nothing to wait for.

  const status = await whenAvailabilityKnown(url);
  if (status === 'missing') return; // the proxy (or nothing) is the final answer.

  await whenGlbSettled(url);
}
