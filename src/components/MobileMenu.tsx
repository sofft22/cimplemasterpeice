import { useState, useEffect, useRef } from 'react';
import { NavLinks } from './NavLinks';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center text-black transition-colors duration-300 hover:text-rose"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[20px] w-[20px]">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[20px] w-[20px]">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-[240px] overflow-hidden border border-[#e5e5e5] bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)]">
          <NavLinks
            variant="mobile"
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}