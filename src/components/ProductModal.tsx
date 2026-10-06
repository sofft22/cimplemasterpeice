import { useState, useRef, useEffect, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../config';
import { fetchApprovedReviews, submitReview, type StoreReview } from '../lib/store';
import type { Product } from '../types';

interface Props {
  product: Product;
  products: Product[];
  onClose: () => void;
  onAddToCart: (
    qty: number,
    variant?: string,
    variantPriceDelta?: number,
    opts?: { silent?: boolean }
  ) => void;
  onOpenProduct: (p: Product) => void;
}

/* Fisher-Yates shuffle for the "Complete the look" section */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ProductModal({
  product,
  products,
  onClose,
  onAddToCart,
  onOpenProduct,
}: Props) {
  const { settings } = useSettings();
  const [qty, setQty] = useState(1);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [mainImgLoaded, setMainImgLoaded] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState<StoreReview[]>([]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  const images = [product.image_url, ...(product.image_urls ?? [])].slice(0, 3);
  const currentImage = images[activeImage] ?? product.image_url;

  /* SEO-friendly alt text for the main product image */
  const mainAlt = `${product.name} — Cimmple Hair`;

  const variants = product.variants?.suggested ?? [];
  const hasVariants = variants.length > 0;

  const selectedVariant = variants.find((v) => v.label === selectedVariantLabel);
  const priceDelta = selectedVariant?.priceDelta ?? 0;
  const displayPrice = product.price + priceDelta;
  const displayCompare =
    product.compare_at_price != null ? product.compare_at_price + priceDelta : null;

  const canAdd = !hasVariants || selectedVariantLabel !== null;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await fetchApprovedReviews(product.id);
      if (!cancelled) setReviews(r);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  /* "Complete the look" — up to 2 same-category siblings + complementary, shuffled */
  const pairs = useMemo(() => {
    if (!products || products.length === 0) return [];
    const others = products.filter((p) => p.id !== product.id);

    const same = shuffle(
      others.filter((p) => p.category_id === product.category_id)
    );
    const rest = shuffle(
      others.filter((p) => p.category_id !== product.category_id)
    );

    const pick: Product[] = [];
    for (const p of same.slice(0, 2)) pick.push(p);
    for (const p of rest) {
      if (pick.length >= 4) break;
      pick.push(p);
    }
    if (pick.length < 4) {
      for (const p of same.slice(2)) {
        if (pick.length >= 4) break;
        pick.push(p);
      }
    }
    return shuffle(pick);
  }, [products, product.id, product.category_id]);

  const goToImage = (i: number) => {
    if (i === activeImage) return;
    setMainImgLoaded(false);
    setActiveImage(i);
  };

  const handleImageTap = () => {
    if (images.length <= 1) return;
    const next = (activeImage + 1) % images.length;
    goToImage(next);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && activeImage < images.length - 1) goToImage(activeImage + 1);
      else if (deltaX > 0 && activeImage > 0) goToImage(activeImage - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const openWa = (message: string) => {
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(qty, selectedVariantLabel ?? undefined, priceDelta, { silent: true });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1400);
  };

  const handleAskUs = () => {
    const variant = selectedVariantLabel ? ` (${selectedVariantLabel})` : '';
    openWa(
      `Hi, I have a question about:\n\n• ${product.name}${variant}\n\nMy question is: ____`
    );
  };

  const handleCustom = () => {
    const variant = selectedVariantLabel ? ` (${selectedVariantLabel})` : '';
    openWa(`Hi, can ${product.name}${variant} be customised?`);
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out ${product.name}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} — ${url}`)}`,
      '_blank'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    const { error } = await submitReview({
      product_id: product.id,
      customer_name: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);

    if (error) {
      setReviewError(error);
      return;
    }

    setShowReviewForm(false);
    setShowThanks(true);
    setReviewName('');
    setReviewRating(5);
    setReviewComment('');
    setTimeout(() => setShowThanks(false), 4000);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={modalScrollRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white font-sans sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-colors duration-400 ease-premium hover:bg-white hover:text-rose"
          aria-label="Close"
        >
          ✕
        </button>

        {/* TOP */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="bg-pink-soft">
            <button
              onClick={handleImageTap}
              className="relative block aspect-[4/5] w-full overflow-hidden"
              style={{ touchAction: 'pan-y' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              aria-label="Next image"
            >
              {!mainImgLoaded && <div className="absolute inset-0 skeleton" />}
              {currentImage && (
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={mainAlt}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => setMainImgLoaded(true)}
                  draggable={false}
                  className={`h-full w-full object-cover transition-opacity duration-500 ${
                    mainImgLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}

              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:hidden">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeImage ? 'w-5 bg-black' : 'w-1.5 bg-black/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>

            {images.length > 1 && (
              <div className="hidden gap-2 p-3 sm:flex">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={`aspect-square w-16 overflow-hidden rounded-md border-2 transition-colors ${
                      i === activeImage
                        ? 'border-rose'
                        : 'border-transparent hover:border-[#f2e4e8]'
                    }`}
                    aria-label={`View image ${i + 1} of ${images.length}`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} — thumbnail ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-12">
            <h2 className="text-[20px] font-bold uppercase leading-tight tracking-[0.04em] text-black sm:text-[26px]">
              {product.name}
            </h2>

            <div className="mt-3 flex items-baseline gap-3 sm:mt-4 sm:gap-4">
              <p className="text-[19px] font-bold text-black sm:text-[22px]">
                {formatPrice(displayPrice)}
              </p>
              {displayCompare && (
                <p className="text-[13px] text-black/50 line-through sm:text-[14px]">
                  {formatPrice(displayCompare)}
                </p>
              )}
            </div>

            {product.description && (
              <p className="mt-5 text-[13.5px] font-normal leading-[1.7] text-black/70 sm:mt-6 sm:text-[14px]">
                {product.description}
              </p>
            )}

            {hasVariants && product.in_stock && (
              <div className="mt-8">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                  Choose {selectedVariantLabel ? '' : '· required'}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const active = selectedVariantLabel === v.label;
                    return (
                      <button
                        key={v.label}
                        onClick={() => setSelectedVariantLabel(v.label)}
                        className={`rounded-full border px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] transition-colors duration-400 ease-premium ${
                          active
                            ? 'border-rose bg-rose text-white'
                            : 'border-[#f2e4e8] text-black hover:border-rose'
                        }`}
                      >
                        {v.label}
                        {v.priceDelta > 0 && (
                          <span
                            className={`ml-2 font-bold ${
                              active ? 'text-white/90' : 'text-rose'
                            }`}
                          >
                            +{formatPrice(v.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.in_stock && (
              <>
                <div className="mt-8 flex items-center gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                    Qty
                  </span>
                  <div className="inline-flex items-center rounded-full border border-[#f2e4e8]">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-l-full text-black transition-colors duration-400 ease-premium hover:bg-rose/5"
                    >
                      −
                    </button>
                    <span className="flex h-10 w-10 items-center justify-center text-[13px] font-bold">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-r-full text-black transition-colors duration-400 ease-premium hover:bg-rose/5"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className={`mt-8 w-full rounded-full py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium ${
                    canAdd
                      ? addedFlash
                        ? 'bg-black'
                        : 'bg-rose hover:bg-rose-deep'
                      : 'cursor-not-allowed bg-rose/40'
                  }`}
                >
                  {!canAdd ? 'Choose an option' : addedFlash ? 'Added ✓' : 'Add to bag'}
                </button>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAskUs}
                    className="rounded-full border border-[#f2e4e8] py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors duration-400 ease-premium hover:border-rose hover:text-rose"
                  >
                    Ask us
                  </button>
                  <button
                    onClick={handleCustom}
                    className="rounded-full border border-[#f2e4e8] py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors duration-400 ease-premium hover:border-rose hover:text-rose"
                  >
                    Custom
                  </button>
                </div>

                <div className="mt-9 flex items-center gap-4 border-t border-[#f2e4e8] pt-7">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">
                    Share
                  </span>

                  <button
                    onClick={handleShareWhatsApp}
                    aria-label="Share on WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f2e4e8] text-black transition-colors duration-400 ease-premium hover:border-rose hover:text-rose"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
                    </svg>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    aria-label="Copy link"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f2e4e8] text-black transition-colors duration-400 ease-premium hover:border-rose hover:text-rose"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
                    </svg>
                  </button>

                  <span
                    className={`text-[11px] font-bold uppercase tracking-[0.18em] text-rose transition-opacity duration-400 ease-premium ${
                      copied ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    Copied
                  </span>
                </div>
              </>
            )}

            {!product.in_stock && (
              <p className="mt-6 rounded-full bg-pink-soft py-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
                Sold out
              </p>
            )}
          </div>
        </div>

        {/* COMPLETE THE LOOK */}
        {pairs.length > 0 && (
          <div className="border-t border-[#f2e4e8] bg-white px-6 py-14 sm:px-12 sm:py-16">
            <h3 className="text-[17px] font-bold uppercase tracking-tight text-black sm:text-[20px]">
              Complete the look
            </h3>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {pairs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveImage(0);
                    setSelectedVariantLabel(null);
                    setMainImgLoaded(false);
                    onOpenProduct(p);
                    modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group text-left"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[#fbeef1]">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={`${p.name} — Cimmple Hair`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 text-[10px] font-medium uppercase tracking-[0.06em] text-black sm:mt-3 sm:text-[11.5px]">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-black/50 sm:mt-1 sm:text-[11.5px]">
                    {formatPrice(p.price)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        <div className="border-t border-[#f2e4e8] px-6 py-14 sm:px-12 sm:py-16">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold uppercase tracking-tight text-black sm:text-[20px]">
              Reviews
            </h3>
            {avgRating ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/60">
                ★★★★★ {avgRating} · {reviews.length}
              </p>
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/40">
                No reviews yet
              </p>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="mt-6 text-[13px] text-black/50">
              Be the first to review this product.
            </p>
          ) : (
            <div className="mt-7 space-y-5">
              {visibleReviews.map((r) => (
                <article key={r.id} className="rounded-2xl border border-[#f2e4e8] bg-white p-7">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-black">
                      {r.customer_name}
                    </p>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/50">
                      {new Date(r.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <p className="mt-3 text-[12px] tracking-[0.14em] text-rose">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </p>
                  <p className="mt-4 text-[14px] leading-[1.7] text-black">
                    "{r.comment}"
                  </p>
                </article>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-5">
            {reviews.length > 1 && (
              <button
                onClick={() => setShowAllReviews((v) => !v)}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose transition-colors duration-400 ease-premium hover:text-rose-deep"
              >
                {showAllReviews ? 'See less' : `See all reviews (${reviews.length})`}
              </button>
            )}

            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="rounded-full border border-black px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors duration-400 ease-premium hover:border-rose hover:text-rose"
              >
                Write a review
              </button>
            )}
          </div>

          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="mt-7 space-y-4 rounded-2xl bg-pink-soft p-7"
            >
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/60">
                  Your name
                </label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-full border border-[#f2e4e8] bg-white px-5 py-3 text-[13px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                  placeholder="e.g. Chioma O."
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/60">
                  Rating
                </label>
                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className={`text-[24px] leading-none transition-colors duration-400 ease-premium ${
                        n <= reviewRating ? 'text-rose' : 'text-[#f2e4e8]'
                      }`}
                      aria-label={`${n} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-black/60">
                  Your review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-[#f2e4e8] bg-white px-5 py-3 text-[13px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                  placeholder="Tell us what you think…"
                />
              </div>

              {reviewError && (
                <p className="rounded-xl bg-red-50 px-5 py-3 text-[12px] font-medium text-red-700">
                  {reviewError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 rounded-full bg-rose py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium hover:bg-rose-deep disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="rounded-full border border-[#f2e4e8] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-400 ease-premium hover:border-black"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showThanks && (
            <p className="fade-in mt-5 rounded-full bg-rose/10 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
              Thanks! Your review will appear after approval.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}