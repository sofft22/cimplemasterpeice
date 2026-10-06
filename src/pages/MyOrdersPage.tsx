import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface LocalOrder {
  token: string;
  orderId: string;
  date: string;
}

const LS_KEY = 'cimmple_my_orders_v1';

function readOrders(): LocalOrder[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o) => o && typeof o.token === 'string' && typeof o.orderId === 'string'
    );
  } catch {
    return [];
  }
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    setOrders(readOrders());
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear your saved orders from this device?')) {
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <Helmet>
        <title>My Orders — Cimmple Hair</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="px-5 pt-[88px] pb-20 sm:px-8 sm:pt-[96px] lg:px-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose">
                Your orders
              </p>
              <h1 className="mt-2 text-[22px] font-bold uppercase leading-tight tracking-tight text-black sm:text-[26px]">
                My Orders
              </h1>
            </div>

            {orders.length > 0 && (
              <button
                onClick={handleClear}
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/50 transition-colors hover:text-rose"
              >
                Clear history
              </button>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-[#e5e5e5] bg-white p-8 text-center">
              <p className="text-[13px] text-black/60">
                You haven't placed any orders on this device yet.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-rose-deep"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-3">
              {orders.map((o) => (
                <li key={o.token}>
                  <Link
                    to={`/order/${o.token}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 transition-colors hover:border-rose"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-black">
                        {o.orderId}
                      </p>
                      <p className="mt-1 text-[11.5px] text-black/50">
                        {new Date(o.date).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-rose">
                      Track
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        className="h-3 w-3"
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 text-center text-[10.5px] leading-[1.7] text-black/40">
            Orders are saved on this device only. If you switch phones or clear your browser, they won't appear here.
          </p>
        </div>
      </main>

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
    </div>
  );
}