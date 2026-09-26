import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Route changes should start at the top; hash links should still jump. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;
