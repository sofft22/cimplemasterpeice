import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true);
        else if (entry.intersectionRatio === 0) setShown(false);
      },
      { threshold: [0, 0.15] }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
}