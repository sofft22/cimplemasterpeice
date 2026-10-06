import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../config/categories';

interface Props {
  variant: 'desktop' | 'mobile';
  onClose?: () => void;
  onShopClick?: () => void;
  onBestSellersClick?: () => void;
  onReviewsClick?: () => void;
  onOurHairClick?: () => void;
  textColor?: 'white' | 'black';
}

export function NavLinks({
  variant,
  onClose,
  onShopClick,
  onBestSellersClick,
  onReviewsClick,
  onOurHairClick,
  textColor = 'black',
}: Props) {
  const navigate = useNavigate();
  const [shopOpen, setShopOpen] = useState(false);

  const go = (path: string) => {
    onClose?.();
    setShopOpen(false);
    navigate(path);
  };

  const openModal = (key: 'about') => {
    onClose?.();
    setShopOpen(false);
    window.dispatchEvent(new CustomEvent(`open-modal:${key}`));
  };

  const fireSection = (cb?: () => void) => {
    onClose?.();
    setShopOpen(false);
    cb?.();
  };

  if (variant === 'desktop') {
    const base = textColor === 'white' ? 'text-white' : 'text-black';

    return (
      <nav className="hidden flex-1 items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-[0.16em] md:flex lg:gap-9 lg:text-[12.5px] lg:tracking-[0.14em]">
        <button
          onClick={() => fireSection(onBestSellersClick)}
          className={`whitespace-nowrap transition-colors duration-300 hover:text-rose ${base}`}
        >
          Best Sellers
        </button>

        <button
          onClick={() => fireSection(onOurHairClick)}
          className={`whitespace-nowrap transition-colors duration-300 hover:text-rose ${base}`}
        >
          Our Hair
        </button>

        <div
          className="relative"
          onMouseEnter={() => setShopOpen(true)}
          onMouseLeave={() => setShopOpen(false)}
        >
          <button
            onClick={() => go('/shop')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors duration-300 hover:text-rose ${base}`}
          >
            Shop
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className={`h-3 w-3 transition-transform duration-300 ${shopOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {shopOpen && (
            <div className="absolute left-1/2 top-full z-40 mt-4 w-[220px] -translate-x-1/2 border border-[#e5e5e5] bg-white py-2 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]">
              <button
                onClick={() => go('/shop')}
                className="block w-full px-5 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.14em] text-black transition-colors duration-300 hover:bg-[#f5f5f0] hover:text-rose"
              >
                Shop all
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go(`/shop?category=${c.id}`)}
                  className="block w-full px-5 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.14em] text-black transition-colors duration-300 hover:bg-[#f5f5f0] hover:text-rose"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => fireSection(onReviewsClick)}
          className={`whitespace-nowrap transition-colors duration-300 hover:text-rose ${base}`}
        >
          Reviews
        </button>

                <button
          onClick={() => openModal('about')}
          className={`whitespace-nowrap transition-colors duration-300 hover:text-rose ${base}`}
        >
          About
        </button>

        <button
          onClick={() => go('/my-orders')}
          className={`whitespace-nowrap transition-colors duration-300 hover:text-rose ${base}`}
        >
          My Orders
        </button>
      </nav>
    );
  }

  return null;
}