import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BRAND } from '../config';
import { NavLinks } from './NavLinks';
import { useCart } from '../context/CartContext';

export function Header() {
  const { totalItems, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const lastY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchOpenAtY = useRef(0);
  const composing = useRef(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      if (searchOpen && Math.abs(y - searchOpenAtY.current) > 40) {
        setSearchOpen(false);
        setQ('');
      }

      if (y < 60) {
        setHidden(false);
        lastY.current = y;
        return;
      }
      if (y > lastY.current && y > 80) setHidden(true);
      else if (y < lastY.current) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      searchOpenAtY.current = window.scrollY;
      const t = setTimeout(() => searchRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    window.history.pushState({ cimmpleSearch: true }, '');
    const onPop = () => {
      setSearchOpen(false);
      setQ('');
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const goHome = () => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const goToSection = (id: string) => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const goTo = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleSearchChange = (value: string) => {
    setQ(value);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQ('');
  };

  const isHomeOrShop =
    location.pathname === '/' || location.pathname === '/shop';
  const transparent = isHomeOrShop && !scrolled && !searchOpen;

  return (
    <header
      role="banner"
      className={`fixed left-0 right-0 z-40 w-full transition-[background-color,border-color,transform] duration-300 ease-out ${
        transparent
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm'
      } ${
        !transparent && hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ top: 'var(--promo-banner-height, 0px)' }}
    >
      {searchOpen ? (
        <div className="mx-auto flex h-[64px] max-w-7xl items-center gap-2 px-4 sm:h-[68px] sm:px-6 lg:px-10">
          <button
            onClick={closeSearch}
            aria-label="Close search"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-black transition-colors hover:text-rose sm:h-9 sm:w-9"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex flex-1 items-center"
            autoComplete="off"
          >
            <input
              ref={searchRef}
              type="text"
              value={q}
              onChange={(e) => {
                if (composing.current) return;
                handleSearchChange(e.target.value);
              }}
              onCompositionStart={() => { composing.current = true; }}
              onCompositionEnd={(e) => {
                composing.current = false;
                handleSearchChange((e.target as HTMLInputElement).value);
              }}
              inputMode="search"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Search products…"
              className="h-10 w-full rounded-full border border-[#e5e5e5] bg-white px-5 text-[14px] font-medium text-black outline-none placeholder:text-black/40 focus:border-rose"
            />
          </form>

          {q.length > 0 && (
            <button
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-black/40 transition-colors hover:text-black"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <nav
          aria-label="Main navigation"
          className="relative mx-auto flex h-[64px] max-w-7xl items-center justify-between gap-2 px-4 sm:h-[68px] sm:px-6 lg:px-10"
        >
          <button
            onClick={goHome}
            aria-label="Cimmple Hair — home"
            className="flex shrink-0 items-baseline whitespace-nowrap text-[15px] uppercase tracking-[0.04em] leading-none sm:text-[17px] lg:text-[22px]"
          >
            <span className={`font-bold transition-colors duration-300 ${transparent ? 'text-white' : 'text-black'}`}>
              {BRAND.nameStrong}
            </span>
            <span className={`font-light transition-colors duration-300 ${transparent ? 'text-white/70' : 'text-black/60'}`}>
              &nbsp;{BRAND.nameLight}
            </span>
            <span className="font-bold text-rose">.</span>
          </button>

          <NavLinks
            variant="desktop"
            onShopClick={() => navigate('/shop')}
            onBestSellersClick={() => goToSection('best-sellers')}
            onReviewsClick={() => goToSection('reviews')}
            onOurHairClick={() => goToSection('our-hair')}
            textColor={transparent ? 'white' : 'black'}
          />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className={`flex h-8 w-8 items-center justify-center transition-colors duration-300 hover:text-rose sm:h-9 sm:w-9 ${transparent ? 'text-white' : 'text-black'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>

            <button
              onClick={openCart}
              aria-label={`Open cart${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
              className={`relative flex h-8 w-8 items-center justify-center transition-colors duration-300 hover:text-rose sm:h-9 sm:w-9 ${transparent ? 'text-white' : 'text-black'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            <div ref={menuRef} className="relative md:hidden">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                className={`flex h-8 w-8 items-center justify-center transition-colors duration-300 hover:text-rose ${transparent ? 'text-white' : 'text-black'}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[20px] w-[20px]">
                  {mobileOpen ? (
                    <path d="M6 6l12 12M18 6l-12 12" />
                  ) : (
                    <path d="M3 6h18M3 12h18M3 18h18" />
                  )}
                </svg>
              </button>

              {mobileOpen && (
                <nav
                  aria-label="Mobile menu"
                  className="absolute right-0 top-full mt-2 w-[220px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.25)]"
                >
                  <ul className="flex flex-col">
                    <li>
                      <button onClick={() => goTo('/my-orders')} className="w-full border-b border-[#f0f0f0] px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#fafafa] hover:text-rose">
                        My Orders
                      </button>
                    </li>
                    <li>
                      <button onClick={() => goTo('/shop')} className="w-full border-b border-[#f0f0f0] px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#fafafa] hover:text-rose">
                        Shop all
                      </button>
                    </li>
                    <li>
                      <button onClick={() => goToSection('best-sellers')} className="w-full border-b border-[#f0f0f0] px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#fafafa] hover:text-rose">
                        Best Sellers
                      </button>
                    </li>
                    <li>
                      <button onClick={() => goToSection('our-hair')} className="w-full border-b border-[#f0f0f0] px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#fafafa] hover:text-rose">
                        Our Hair
                      </button>
                    </li>
                    <li>
                      <button onClick={() => goToSection('reviews')} className="w-full border-b border-[#f0f0f0] px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#fafafa] hover:text-rose">
                        Reviews
                      </button>
                    </li>
                    <li>
                      <button onClick={() => goTo('/about')} className="w-full px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#fafafa] hover:text-rose">
                        About
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}