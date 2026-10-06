import type { Service } from '../types';

interface Props {
  services: Service[];
  onSeeDetails: () => void;
}

export function ServiceBanner({ services, onSeeDetails }: Props) {
  if (services.length === 0) return null;

  const hero = services[0];
  const lowestPrice = Math.min(
    ...services.flatMap((s) => (s.variants ?? []).map((v) => v.price))
  );

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="mb-14 sm:mb-20">
          <div className="mb-5 h-px w-12 bg-rose" />
          <h2 className="text-[22px] font-medium leading-none tracking-tight text-black sm:text-[26px]">
            Beauty, done for you.
          </h2>
        </div>

        <button
          onClick={onSeeDetails}
          className="group block w-full overflow-hidden rounded-2xl border border-[#f2e4e8] text-left transition-colors duration-400 ease-premium hover:border-rose/40"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#fbeef1] md:aspect-auto md:h-full md:min-h-[360px]">
              {hero.image_url && (
                <img
                  src={hero.image_url}
                  alt={hero.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.02]"
                />
              )}
            </div>

            <div className="flex flex-col justify-center gap-4 p-8 sm:p-12 md:p-14">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose">
                In-studio
              </p>
              <h3 className="text-[26px] font-medium leading-[1.15] tracking-tight text-black sm:text-[32px]">
                {services.length} services. One studio.
              </h3>
              <p className="max-w-md text-[13.5px] leading-relaxed text-black/60">
                Hair, makeup, skin, and nails — book a session that fits your day.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6">
                <span className="text-[13px] font-medium text-black">
                  From ₦{lowestPrice.toLocaleString('en-NG')}
                </span>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose">
                  See details
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-3.5 w-3.5 transition-transform duration-400 ease-premium group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}