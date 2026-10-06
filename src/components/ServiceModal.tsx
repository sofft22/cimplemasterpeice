import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../config';
import type { Service } from '../types';

interface Props {
  services: Service[];
  onClose: () => void;
}

export function ServiceModal({ services, onClose }: Props) {
  const { settings } = useSettings();
  const [openId, setOpenId] = useState<string | null>(services[0]?.id ?? null);

  const openWa = (message: string) => {
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleBook = (service: Service, price: number) => {
    const msg =
      `Hi Cimmple, I'd like to book:\n\n` +
      `• ${service.name}\n` +
      `Price: ${formatPrice(price)}\n` +
      (service.duration ? `Duration: ${service.duration}\n` : '') +
      `\nPreferred date: ____\nPreferred time: ____\nMy name is ____`;
    openWa(msg);
  };

  const handleAsk = (service: Service) => {
    openWa(`Hi, I have a question about ${service.name}.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white font-sans sm:max-w-2xl sm:rounded-3xl"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-colors duration-400 ease-premium hover:text-rose"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="border-b border-[#f2e4e8] px-7 pb-9 pt-11 sm:px-10 sm:pt-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-rose">
            In-studio
          </p>
          <h2 className="mt-4 text-[28px] font-medium leading-tight tracking-tight text-black sm:text-[34px]">
            Our services
          </h2>
          <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-black/60">
            Tap a service to see details. Book directly on WhatsApp.
          </p>
        </div>

        {/* Accordion */}
        <div>
          {services.map((service, idx) => {
            const open = openId === service.id;
            const price = service.price ?? 0;

            return (
              <div
                key={service.id}
                className={`border-b border-[#f2e4e8] ${
                  idx === services.length - 1 ? 'border-b-0' : ''
                }`}
              >
                {/* Row header */}
                <button
                  onClick={() => setOpenId(open ? null : service.id)}
                  className="flex w-full items-center gap-5 px-7 py-6 text-left transition-colors duration-400 ease-premium hover:bg-rose/[0.03] sm:px-10"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-[#fbeef1]">
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium uppercase tracking-[0.04em] text-black">
                      {service.name}
                    </p>
                    <p className="mt-1.5 text-[12.5px] font-medium text-black/55">
                      {service.duration ? `${service.duration} · ` : ''}
                      {formatPrice(price)}
                    </p>
                  </div>

                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#f2e4e8] text-black transition-transform duration-400 ease-premium ${
                      open ? 'rotate-180' : ''
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="h-4 w-4"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {/* Expanded content */}
                {open && (
                  <div className="bg-[#fdfafb] px-7 pb-9 pt-3 sm:px-10">
                    {service.description && (
                      <p className="mb-6 mt-3 text-[13.5px] leading-relaxed text-black/70">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-5 rounded-2xl border border-[#f2e4e8] bg-white px-6 py-5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose">
                          Price
                        </p>
                        <p className="mt-2 font-numbers text-[28px] leading-none text-black">
                          {formatPrice(price)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleBook(service, price)}
                        className="flex-shrink-0 rounded-full bg-rose px-7 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.16em] text-white transition-colors duration-400 ease-premium hover:bg-rose-deep"
                      >
                        Book
                      </button>
                    </div>

                    <button
                      onClick={() => handleAsk(service)}
                      className="mt-5 text-[12px] font-bold uppercase tracking-[0.16em] text-rose transition-colors duration-400 ease-premium hover:text-rose-deep"
                    >
                      Ask a question →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f2e4e8] bg-[#fdfafb] px-7 py-6 text-center sm:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50">
            Lagos studio · Mon–Sat 10–6 · Pay after service
          </p>
        </div>
      </div>
    </div>
  );
}