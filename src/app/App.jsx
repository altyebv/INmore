import { Suspense, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { localeFromPath, useLocale, useT } from '@/i18n';
import ErrorBoundary from './ErrorBoundary';
import ScrollToTop from './ScrollToTop';
import routes from './routes';
import { ShellContext } from './ShellContext';

function RouteFallback() {
  return <div style={{ minHeight: '100svh' }} aria-busy="true" />;
}

export function App() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { pathname } = useLocation();

  // The path decides the language: back/forward and pasted links can cross
  // between `/…` and `/ar/…` without going through the language toggle.
  useEffect(() => {
    const fromPath = localeFromPath(pathname);
    if (fromPath !== locale) setLocale(fromPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // A route can declare itself an app shell — a fixed, self-contained surface
  // that owns the whole viewport. The studio does this on touch layouts, where
  // a page footer below a pinned viewer and a bottom sheet makes no sense.
  const [appShell, setAppShell] = useState(false);
  const shell = useMemo(() => ({ appShell, setAppShell }), [appShell]);

  return (
    <ShellContext.Provider value={shell}>
      <a className="u-skip-link" href="#main">
        {t.common.skipToContent}
      </a>

      <ScrollToTop />
      <SiteHeader />

      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {routes.flatMap((route) => {
              if (route.path === '*') {
                return [<Route key="*" path="*" element={route.element} />];
              }

              const arPath = route.path === '/' ? '/ar' : `/ar${route.path}`;
              return [
                <Route key={route.path} path={route.path} element={route.element} />,
                <Route key={arPath} path={arPath} element={route.element} />,
              ];
            })}
          </Routes>
        </Suspense>
      </ErrorBoundary>

      {!appShell && <SiteFooter />}
    </ShellContext.Provider>
  );
}

export default App;
