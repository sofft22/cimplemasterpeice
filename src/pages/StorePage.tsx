import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { Header } from '../components/Header';
import { PictureBreak } from '../components/PictureBreak';
import { Reviews } from '../components/Reviews';
import { Footer } from '../components/Footer';
import { FloatingWhatsAppButton } from '../components/FloatingWhatsAppButton';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import {
  fetchPublicProducts,
  fetchTrendingIds,
  fetchFeaturedCoupon,
  type Coupon,
} from '../lib/store';
import { peekProducts, loadProducts } from '../lib/products-cache';
import { HeroAnimated } from '../components/HeroAnimated';
import { formatPrice } from '../config';
import type { Product } from '../types';

const ProductModal = lazy(() =>
  import('../components/ProductModal').then((m) => ({ default: m.ProductModal }))
);

const COLS = { mobile: 2, tablet: 3, desktop: 4 };
const ROWS = { mobile: 3, tablet: 2, desktop: 2 };

const GRID_CLASS =
  'grid grid-cols-2 gap-x-[18px] gap-y-[34px] sm:grid-cols-3 sm:gap-x-[22px] lg:grid-cols-4';

function useLayout() {
  const [layout, setLayout] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setLayout('desktop');
      else if (w >= 640) setLayout('tablet');
      else setLayout('mobile');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return layout;
}

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className={`mt-10 ${GRID_CLASS}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[4/5] w-full skeleton" />
          <div className="mt-2.5 h-3 w-3/4 skeleton" />
          <div className="mt-1 h-3 w-1/3 skeleton" />
        </div>
      ))}
    </div>
  );
}

function bannerText(c: Coupon): string {
  if (c.banner_text && c.banner_text.trim()) {
    return c.banner_text.trim();
  }

  const parts: string[] = [];

  if (c.first_order_only) parts.push('New customers');

  if (c.type === 'percent') parts.push(`${c.value}% off`);
  else if (c.type === 'fixed') parts.push(`₦${c.value.toLocaleString('en-NG')} off`);
  else if (c.type === 'shipping') parts.push('Free shipping');

  if (c.min_order > 0) {
    parts.push(`on orders over ₦${c.min_order.toLocaleString('en-NG')}`);
  }

  return parts.join(' · ');
}

function formatTimeLeft(expiresAt: string): string | null {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function StorePage() {
  const { settings } = useSettings();

  // Prime from cache so the grid renders on first paint on revisit
  const cachedProducts = peekProducts();
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(!cachedProducts);

  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const [featuredCoupon, setFeaturedCoupon] = useState<Coupon | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  const layout = useLayout();
  const limit = COLS[layout] * ROWS[layout];

  useEffect(() => {
    let cancelled = false;

    loadProducts(() => fetchPublicProducts()).then((p) => {
      if (cancelled) return;
      setProducts(p);
      setLoading(false);
      (window as any).__products = p;
    });

    fetchTrendingIds().then((ids) => {
      if (cancelled) return;
      setBestSellerIds(ids);
    });

    fetchFeaturedCoupon().then((c) => {
      if (cancelled) return;
      setFeaturedCoupon(c);
    });

    try {
      if (sessionStorage.getItem('promo_banner_dismissed') === '1') {
        setBannerDismissed(true);
      }
    } catch {
      // ignore
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!featuredCoupon?.expires_at) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const t = formatTimeLeft(featuredCoupon.expires_at!);
      setTimeLeft(t);
      if (!t) setFeaturedCoupon(null);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [featuredCoupon]);

  const showBanner = !!featuredCoupon && !bannerDismissed;

  useEffect(() => {
    const h = showBanner ? '44px' : '0px';
    document.documentElement.style.setProperty('--promo-banner-height', h);
    return () => {
      document.documentElement.style.setProperty('--promo-banner-height', '0px');
    };
  }, [showBanner]);

  useEffect(() => {
    const handler = (e: Event) => {
      const productId = (e as CustomEvent<string>).detail;
      const product = products.find((p) => p.id === productId);
      if (product) setOpenProduct(product);
    };
    window.addEventListener('open-product', handler);
    return () => window.removeEventListener('open-product', handler);
  }, [products]);

  const bestSellers = useMemo(() => {
    if (products.length === 0) return [];
    if (bestSellerIds.length === 0) return products.slice(0, limit);
    const byId = new Map(products.map((p) => [p.id, p]));
    const list = bestSellerIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => !!p);
    if (list.length < limit) {
      const usedIds = new Set(list.map((p) => p.id));
      const extra = products.filter((p) => !usedIds.has(p.id));
      return [...list, ...extra].slice(0, limit);
    }
    return list.slice(0, limit);
  }, [bestSellerIds, products, limit]);

  const wigs = useMemo(
    () => products.filter((p) => p.category_id === 'wigs').slice(0, limit),
    [products, limit]
  );
  const extensions = useMemo(
    () => products.filter((p) => p.category_id === 'extensions').slice(0, limit),
    [products, limit]
  );
  const care = useMemo(
    () => products.filter((p) => p.category_id === 'care').slice(0, limit),
    [products, limit]
  );

  const openChat = (product: Product) => {
    const msg = `Hi, I'm interested in ${product.name} (${formatPrice(product.price)}).`;
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('promo_banner_dismissed', '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <Helmet>
        <title>Cimmple Hair — Hair, simplified.</title>
        <meta
          name="description"
          content="Shop premium human hair wigs, extensions, and hair care. Fast delivery across Lagos. Order on WhatsApp."
        />
        <link rel="canonical" href="https://cimplemasterpiece.pages.dev/" />
      </Helmet>

      {showBanner && featuredCoupon && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-rose text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-5 py-2.5 sm:px-8 lg:px-10">
            <p className="truncate text-center text-[11px] font-bold uppercase tracking-[0.14em] sm:text-[12.5px]">
              <span className="opacity-90">🎉 {bannerText(featuredCoupon)}</span>
              <span className="mx-2 opacity-40">·</span>
              <span className="tracking-[0.18em]">
                Use <strong>{featuredCoupon.code.toUpperCase()}</strong>
              </span>
              {timeLeft && (
                <>
                  <span className="mx-2 opacity-40">·</span>
                  <span className="tracking-[0.16em] text-white/85">
                    Ends in {timeLeft}
                  </span>
                </>
              )}
            </p>
            <button
              onClick={dismissBanner}
              aria-label="Dismiss banner"
              className="ml-2 shrink-0 text-white/70 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-[14px]">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Header />

      {!settings.store_open && (
        <div className="bg-rose/10 px-5 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
            {settings.closed_message}
          </p>
        </div>
      )}

      <HeroAnimated />

      <section
        id="best-sellers"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-24 pb-24 sm:px-8 sm:pt-32 sm:pb-32 lg:px-10"
      >
        <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
          <Link to="/shop" className="group">
            <h2 className="text-[15px] font-bold uppercase leading-none tracking-tight text-black transition-colors duration-300 group-hover:text-rose sm:text-[19px]">
              Trending products
            </h2>
          </Link>
          <Link to="/shop" className="group inline-flex flex-col items-end shrink-0">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-400 ease-premium group-hover:text-rose sm:text-[11px]">
              See more
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-400 ease-premium group-hover:translate-x-1">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
            <span className="mt-1 h-px w-full bg-black transition-opacity duration-400 ease-premium group-hover:opacity-40" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={limit} />
        ) : (
          <div className={GRID_CLASS}>
            {bestSellers.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <div className="relative">
                  <span className="absolute left-2 top-2 z-10 bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-black shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
                    New
                  </span>
                  <ProductCard
                    product={p}
                    priority={i < 4}
                    onClick={() => setOpenProduct(p)}
                    onChat={() => openChat(p)}
                    onAddToCart={() => addToCart(p, 1)}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <PictureBreak />

      <section className="pt-12 sm:pt-16">
        <div className="mx-auto max-w-7xl px-5 pb-6 sm:px-8 sm:pb-8 lg:px-10">
          <div className="text-center">
            <h2 className="text-[13px] font-bold uppercase leading-none tracking-tight text-black sm:text-[17px]">
              Shop by category
            </h2>
          </div>
        </div>

        {!loading && wigs.length > 0 && (
          <div className="mx-auto max-w-7xl border-t border-[#e5e5e5] px-5 pt-10 pb-14 sm:px-8 sm:pt-12 sm:pb-16 lg:px-10">
            <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
              <Link to="/shop?category=wigs" className="group">
                <h3 className="text-[13px] font-bold uppercase leading-none tracking-tight text-black transition-colors duration-300 group-hover:text-rose sm:text-[16px]">
                  Wigs
                </h3>
              </Link>
              <Link to="/shop?category=wigs" className="group inline-flex flex-col items-end shrink-0">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-400 ease-premium group-hover:text-rose sm:text-[11px]">
                  See more
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-400 ease-premium group-hover:translate-x-1">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="mt-1 h-px w-full bg-black transition-opacity duration-400 ease-premium group-hover:opacity-40" />
              </Link>
            </div>
            <div className={GRID_CLASS}>
              {wigs.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <ProductCard
                    product={p}
                    priority={i < 4}
                    onClick={() => setOpenProduct(p)}
                    onChat={() => openChat(p)}
                    onAddToCart={() => addToCart(p, 1)}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {!loading && extensions.length > 0 && (
          <div className="mx-auto max-w-7xl border-t border-[#e5e5e5] px-5 pt-10 pb-14 sm:px-8 sm:pt-12 sm:pb-16 lg:px-10">
            <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
              <Link to="/shop?category=extensions" className="group">
                <h3 className="text-[13px] font-bold uppercase leading-none tracking-tight text-black transition-colors duration-300 group-hover:text-rose sm:text-[16px]">
                  Extensions
                </h3>
              </Link>
              <Link to="/shop?category=extensions" className="group inline-flex flex-col items-end shrink-0">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-400 ease-premium group-hover:text-rose sm:text-[11px]">
                  See more
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-400 ease-premium group-hover:translate-x-1">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="mt-1 h-px w-full bg-black transition-opacity duration-400 ease-premium group-hover:opacity-40" />
              </Link>
            </div>
            <div className={GRID_CLASS}>
              {extensions.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <ProductCard
                    product={p}
                    priority={i < 4}
                    onClick={() => setOpenProduct(p)}
                    onChat={() => openChat(p)}
                    onAddToCart={() => addToCart(p, 1)}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {!loading && care.length > 0 && (
          <div className="mx-auto max-w-7xl border-t border-[#e5e5e5] px-5 pt-10 pb-14 sm:px-8 sm:pt-12 sm:pb-16 lg:px-10">
            <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
              <Link to="/shop?category=care" className="group">
                <h3 className="text-[13px] font-bold uppercase leading-none tracking-tight text-black transition-colors duration-300 group-hover:text-rose sm:text-[16px]">
                  Hair Care
                </h3>
              </Link>
              <Link to="/shop?category=care" className="group inline-flex flex-col items-end shrink-0">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-400 ease-premium group-hover:text-rose sm:text-[11px]">
                  See more
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-400 ease-premium group-hover:translate-x-1">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="mt-1 h-px w-full bg-black transition-opacity duration-400 ease-premium group-hover:opacity-40" />
              </Link>
            </div>
            <div className={GRID_CLASS}>
              {care.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <ProductCard
                    product={p}
                    priority={i < 4}
                    onClick={() => setOpenProduct(p)}
                    onChat={() => openChat(p)}
                    onAddToCart={() => addToCart(p, 1)}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>

      <Reviews products={products} onOpenProduct={(p) => setOpenProduct(p)} />

      <section className="border-t border-[#e5e5e5] bg-rose">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-[22px] font-bold uppercase tracking-tight text-white sm:text-[28px]">
            Join our channel
          </h2>
          <p className="mx-auto mt-4 max-w-[42ch] text-[13px] leading-[1.7] text-white/85 sm:text-[14px]">
            New drops, sales, and restocks — first.
          </p>
          <a
            href="https://whatsapp.com/channel/YOUR_CHANNEL_ID"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-black transition-transform hover:scale-[1.02] hover:bg-black hover:text-white sm:text-[11px]"
          >
            Join on WhatsApp →
          </a>
        </div>
      </section>

      <Footer />
      <FloatingWhatsAppButton />

      {openProduct && (
        <Suspense fallback={null}>
          <ProductModal
            product={openProduct}
            products={products}
            onClose={() => setOpenProduct(null)}
            onAddToCart={(qty, variant, variantPriceDelta, opts) => {
              addToCart(openProduct, qty, variant, variantPriceDelta, opts);
            }}
            onOpenProduct={(p) => setOpenProduct(p)}
          />
        </Suspense>
      )}
    </div>
  );
}