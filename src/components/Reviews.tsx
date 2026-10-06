import { useEffect, useState } from 'react';
import { fetchTopApprovedReviews, type TopReview } from '../lib/store';
import type { Product } from '../types';

interface Props {
  products: Product[];
  onOpenProduct: (p: Product) => void;
}

export function Reviews({ products, onOpenProduct }: Props) {
  const [reviews, setReviews] = useState<TopReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchTopApprovedReviews(3);
      setReviews(data);
      setLoading(false);
    };
    load();
  }, []);

  // Don't render the section at all if there's nothing to show
  if (loading || reviews.length === 0) return null;

  const handleClick = (review: TopReview) => {
    const product = products.find((p) => p.id === review.product_id);
    if (product) onOpenProduct(product);
  };

  return (
    <section
      id="reviews"
      className="scroll-mt-24 border-t border-[#e5e5e5] bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="text-[14px] font-bold uppercase leading-none tracking-tight text-black sm:text-[22px]">
            FROM OUR CUSTOMERS
          </h2>
        </div>

        {/* Reviews grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {reviews.map((r) => {
            const product = products.find((p) => p.id === r.product_id);
            return (
              <button
                key={r.id}
                onClick={() => handleClick(r)}
                className="group flex flex-col border-t border-[#e5e5e5] pt-6 text-left transition-colors duration-400 ease-premium hover:border-rose sm:pt-8"
              >
                {/* Stars */}
                <div className="text-[12px] tracking-[0.14em] text-rose sm:text-[13px]">
                  {'★'.repeat(r.rating)}
                  <span className="text-black/15">
                    {'★'.repeat(5 - r.rating)}
                  </span>
                </div>

                {/* Quote */}
                <p className="mt-4 flex-1 text-[12.5px] font-medium italic leading-[1.65] text-black sm:mt-5 sm:text-[14.5px] sm:leading-[1.7]">
                  "{r.comment}"
                </p>

                {/* Reviewer */}
                <div className="mt-5 sm:mt-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black sm:text-[12.5px]">
                    {r.customer_name}
                  </p>
                  <p className="mt-1 text-[10.5px] font-medium text-black/50 sm:text-[11.5px]">
                    {r.product_name}
                  </p>
                </div>

                {/* CTA */}
                {product && (
                  <span className="mt-5 inline-flex flex-col items-start sm:mt-6">
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors duration-400 ease-premium group-hover:text-rose sm:text-[11px]">
                      View product
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        className="h-3 w-3 transition-transform duration-400 ease-premium group-hover:translate-x-1"
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="mt-1 h-px w-full bg-black transition-opacity duration-400 ease-premium group-hover:opacity-40" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}