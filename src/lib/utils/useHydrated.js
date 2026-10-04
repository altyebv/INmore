import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true from then on.
 *
 * For things that only exist in a browser — a WebGL canvas, say — and so must
 * not be part of the prerendered markup the client is asked to match.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export default useHydrated;
