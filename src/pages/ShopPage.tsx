import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { FloatingWhatsAppButton } from '../components/FloatingWhatsAppButton';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { CATEGORIES } from '../config/categories';
import { fetchPublicProducts } from '../lib/store';
import { peekProducts, loadProducts } from '../lib/products-cache';
import { formatPrice } from '../config';
import type { Product } from '../types';

const ProductModal = lazy(() =>
  import('../components/ProductModal').then((m) => ({ default: m.ProductModal }))
);

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'name', label: 'Name A–Z' },
];

const COLS = { mobile: 2, tablet: 3, desktop: 4 };
const ROWS = 5;

const BASE_URL = 'https://cimplemasterpiece.pages.dev';

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

function SkeletonGrid({ count = 10 }: { count?: number }) {
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

export function ShopPage() {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const [params, setParams] = useSearchParams();

  // Prime from cache so the grid renders on first paint on revisit
  const cachedProducts = peekProducts();
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(!cachedProducts);

  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  const layout = useLayout();
  const perPage = COLS[layout] * ROWS;

  const activeCategory = params.get('category') ?? 'all';
  const query = (params.get('q') ?? '').trim();
  const queryLower = query.toLowerCase();
  const sort = (params.get('sort') as SortKey) || 'featured';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  useEffect(() => {
    let cancelled = false;
    loadProducts(() => fetchPublicProducts()).then((p) => {
      if (!cancelled) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (queryLower) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          (p.description ?? '').toLowerCase().includes(queryLower)
      );
    } else if (activeCategory !== 'all') {
      list = list.filter((p) => p.category_id === activeCategory);
    }

    const sorted = [...list];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        break;
    }
    return sorted;
  }, [products, activeCategory, queryLower, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('category');
    else next.set('category', id);
    next.delete('page');
    setParams(next);
  };

  const setSort = (key: SortKey) => {
    const next = new URLSearchParams(params);
    if (key === 'featured') next.delete('sort');
    else next.set('sort', key);
    next.delete('page');
    setParams(next);
    setSortOpen(false);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setParams(next);
    const el = document.getElementById('shop-top');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearSearch = () => {
    const next = new URLSearchParams(params);
    next.delete('q');
    next.delete('page');
    setParams(next);
  };

  const openChat = (product: Product) => {
    const msg = `Hi, I'm interested in ${product.name} (${formatPrice(product.price)}).`;
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const activeSortLabel = SORTS.find((s) => s.key === sort)?.label ?? 'Featured';

  const activeCategoryLabel = useMemo(() => {
    if (activeCategory === 'all') return 'The collection';
    const found = CATEGORIES.find((c) => c.id === activeCategory);
    return found ? found.label : 'The collection';
  }, [activeCategory]);

  const itemCount = filtered.length;

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    const max = totalPages;
    const cur = currentPage;
    if (max <= 7) {
      for (let i = 1; i <= max; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (cur > 3) pages.push('…');
    const start = Math.max(2, cur - 1);
    const end = Math.min(max - 1, cur + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (cur < max - 2) pages.push('…');
    pages.push(max);
    return pages;
  }, [totalPages, currentPage]);

  const pageTitle = query
    ? `Search: "${query}" — Cimmple Hair`
    : activeCategory === 'all'
    ? 'Shop all — Cimmple Hair'
    : `${activeCategoryLabel} — Cimmple Hair`;

  const pageDescription = query
    ? `Search results for "${query}" on Cimmple Hair.`
    : activeCategory === 'all'
    ? 'Browse all hair wigs, extensions, and hair care at Cimmple Hair. Fast delivery across Lagos.'
    : `Shop ${activeCategoryLabel.toLowerCase()} at Cimmple Hair. Fast delivery across Lagos.`;

  const canonicalHref =
    activeCategory !== 'all' && !query
      ? `${BASE_URL}/shop?category=${activeCategory}`
      : `${BASE_URL}/shop`;

  return (
    <div className="min-h-screen bg-white text-ink">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalHref} />

        {activeCategory !== 'all' && !query && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: `${BASE_URL}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shop',
                  item: `${BASE_URL}/shop`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: activeCategoryLabel,
                  item: `${BASE_URL}/shop?category=${activeCategory}`,
                },
              ],
            })}
          </script>
        )}
      </Helmet>

      <Header />

      <section
        id="shop-top"
        className="mx-auto max-w-7xl scroll-mt-20 px-5 pt-0 pb-24 sm:px-8 lg:px-10"
      >
        {query ? (
          <div className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4 pt-[84px] sm:pt-[92px]">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                onClick={clearSearch}
                aria-label="Back to shop"
                className="flex h-8 w-8 shrink-0 items-center justify-center text-black transition-colors hover:text-rose"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">
                  Search results for
                </p>
                <h1 className="truncate text-[16px] font-bold uppercase leading-tight tracking-tight text-black sm:text-[20px]">
                  “{query}”
                </h1>
                <p className="mt-1 text-[12px] font-medium text-black/50">
                  {itemCount} {itemCount === 1 ? 'result' : 'results'}
                </p>
              </div>
            </div>

            <button
              onClick={clearSearch}
              className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-black/60 transition-colors hover:text-rose"
            >
              Clear
            </button>
          </div>
        ) : (
          <>
            <div className="-mx-5 bg-rose pb-5 pt-[84px] sm:-mx-8 sm:pb-6 sm:pt-[92px] lg:-mx-10">
              <div className="flex items-baseline justify-center gap-3">
                <h1 className="text-[18px] font-bold uppercase leading-none tracking-tight text-white sm:text-[24px]">
                  {activeCategoryLabel}
                </h1>
                <span className="text-[12px] font-medium text-white/75 sm:text-[13px]">
                  · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-b border-[#e5e5e5] pb-3 sm:mt-8">
              <nav className="no-scrollbar flex flex-1 items-center gap-x-4 overflow-x-auto sm:gap-x-7">
                <button
                  onClick={() => setCategory('all')}
                  className={`relative shrink-0 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 sm:text-[12px] sm:tracking-[0.16em] ${
                    activeCategory === 'all' ? 'text-black' : 'text-black/45 hover:text-black'
                  }`}
                >
                  All
                  {activeCategory === 'all' && (
                    <span className="absolute -bottom-[13px] left-0 h-[2px] w-full bg-rose" />
                  )}
                </button>

                {CATEGORIES.map((c) => {
                  const active = activeCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`relative shrink-0 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 sm:text-[12px] sm:tracking-[0.16em] ${
                        active ? 'text-black' : 'text-black/45 hover:text-black'
                      }`}
                    >
                      {c.label}
                      {active && (
                        <span className="absolute -bottom-[13px] left-0 h-[2px] w-full bg-rose" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="relative shrink-0">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  aria-label={`Sort by ${activeSortLabel}`}
                  className="flex h-8 w-8 items-center justify-center text-black/70 transition-colors hover:text-black sm:h-auto sm:w-auto sm:gap-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="h-[15px] w-[15px] sm:hidden"
                  >
                    <path d="M3 6h18M6 12h12M10 18h4" />
                  </svg>
                  <span className="hidden items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] sm:flex">
                    <span className="text-black/40">Sort:</span>
                    {activeSortLabel}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      className={`h-3 w-3 transition-transform duration-200 ${
                        sortOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setSortOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-full z-40 mt-2 w-[200px] border border-[#e5e5e5] bg-white py-1 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]">
                      {SORTS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setSort(s.key)}
                          className={`block w-full px-4 py-2.5 text-left text-[12px] font-semibold transition-colors ${
                            sort === s.key
                              ? 'bg-[#f5f5f0] text-rose'
                              : 'text-black hover:bg-[#f5f5f0] hover:text-rose'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {loading ? (
          <SkeletonGrid count={perPage} />
        ) : visible.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[13px] font-medium text-black/50">
              {query ? `No products match “${query}”.` : 'No products match your filter.'}
            </p>
          </div>
        ) : (
          <div className={`mt-10 ${GRID_CLASS}`}>
            {visible.map((p, i) => (
              <Reveal key={p.id} delay={i * 30}>
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
        )}

        {totalPages > 1 && !loading && (
          <nav className="mt-14 flex items-center justify-center gap-1 sm:mt-16">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black/50 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {pageNumbers.map((p, idx) =>
              p === '…' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-medium text-black/40"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={`relative flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    p === currentPage
                      ? 'text-black'
                      : 'text-black/45 hover:text-black'
                  }`}
                >
                  {p}
                  {p === currentPage && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 bg-rose" />
                  )}
                </button>
              )
            )}

            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black/50 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </nav>
        )}
      </section>

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
            onAddToCart={(qty, variant, variantPriceDelta, opts) =>
              addToCart(openProduct, qty, variant, variantPriceDelta, opts)
            }
            onOpenProduct={(p) => setOpenProduct(p)}
          />
        </Suspense>
      )}
    </div>
  );
}