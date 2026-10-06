import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { PageSkeleton } from './PageSkeleton';

const MIN_MS = 800; // minimum time the loader stays visible

export function MinDelaySuspense({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <PageSkeleton />;

  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}