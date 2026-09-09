import { createContext, useContext, useEffect } from 'react';

/**
 * Lets a route declare that it owns the whole viewport.
 *
 * Kept deliberately small: one boolean. The alternative — every page knowing
 * about the header and footer — spreads layout decisions across the app.
 */
export const ShellContext = createContext({ appShell: false, setAppShell: () => {} });

/** Declare (or release) app-shell mode for as long as the component is mounted. */
export function useAppShell(active) {
  const { setAppShell } = useContext(ShellContext);

  useEffect(() => {
    setAppShell(active);
    return () => setAppShell(false);
  }, [active, setAppShell]);
}

export default ShellContext;
