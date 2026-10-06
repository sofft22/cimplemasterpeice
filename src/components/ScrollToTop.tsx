import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on every pathname change (ignores search param changes)
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}