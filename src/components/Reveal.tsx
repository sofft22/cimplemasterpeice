import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={shown ? 'reveal reveal-shown' : 'reveal'} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}