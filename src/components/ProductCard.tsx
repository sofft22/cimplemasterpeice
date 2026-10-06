import { useState } from 'react';
import type { Product } from '../types';
import { formatPrice } from '../config';

interface Props {
  product: Product;
  onClick: () => void;
  onChat: () => void;
  onAddToCart: () => void;
  priority?: boolean;
}

export function ProductCard({ product, onClick, onAddToCart, priority }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const hasVariants =
    !!product.variants && product.variants.suggested.length > 0;

  const images = [product.image_url, ...(product.image_urls ?? [])].filter(
    (u): u is string => !!u
  );

  const hasSecondImage = images.length > 1;

  /* SEO-friendly alt text: descriptive, includes the product name */
  const altText = `${product.name} — Cimmple Hair`;

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      onClick();
    } else {
      onAddToCart();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIdx(idx);
  };

  return (
    <article className="group flex flex-col">
      <button
        onClick={onClick}
        className="relative aspect-[4/5] w-full overflow-hidden bg-[#fbeef1]"
        aria-label={`View ${product.name}`}
      >
        {!imgLoaded && <div className="absolute inset-0 skeleton" />}

        {/* DESKTOP: hover swap */}
        <div className="absolute inset-0 hidden md:block">
          {images[0] && (
            <img
              src={images[0]}
              alt={altText}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                hasSecondImage ? 'group-hover:opacity-0' : ''
              } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {hasSecondImage && (
            <img
              src={images[1]}
              alt={`${product.name} — alternate view`}
              loading="lazy"
              fetchPriority="low"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </div>

        {/* MOBILE: swipe carousel */}
        <div className="absolute inset-0 md:hidden">
          {images.length > 0 ? (
            <div
              onScroll={handleScroll}
              className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  className="h-full w-full flex-shrink-0 snap-center"
                >
                  <img
                    src={url}
                    alt={i === 0 ? altText : `${product.name} — view ${i + 1}`}
                    loading={i === 0 && priority ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 && priority ? 'high' : 'auto'}
                    decoding="async"
                    onLoad={i === 0 ? () => setImgLoaded(true) : undefined}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#fbeef1] text-black/40">
              <span className="text-[11px] uppercase tracking-[0.14em]">
                No image
              </span>
            </div>
          )}

          {hasSecondImage && (
            <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex w-10 -translate-x-1/2">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-[3px] flex-1 transition-opacity duration-300 ${
                    i === activeIdx ? 'bg-black' : 'bg-black/25'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {!product.in_stock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-black">
              Sold out
            </span>
          </div>
        )}

        {product.in_stock && (
          <div className="pointer-events-none absolute inset-0 z-10 hidden items-end justify-center pb-6 md:flex">
            <button
              onClick={handleQuickAction}
              className="pointer-events-auto translate-y-3 rounded-full bg-rose px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-rose-deep"
            >
              {hasVariants ? 'Choose options' : 'Add to bag'}
            </button>
          </div>
        )}
      </button>

      <button onClick={onClick} className="mt-2.5 text-left">
        <h3 className="text-[11.5px] font-medium uppercase leading-[1.3] tracking-[0.06em] text-black sm:text-[12.5px]">
          {product.name}
        </h3>
        <p className="mt-1 text-[11px] text-black/50 sm:text-[12.5px]">
          {formatPrice(product.price)}
        </p>
      </button>
    </article>
  );
}