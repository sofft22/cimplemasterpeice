import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchOrderByToken, type TrackedOrder } from '../lib/store';
import { downloadOrderReceipt } from '../lib/receipt';
import { formatPrice } from '../config';

const STATUS_STEPS = ['placed', 'processing', 'delivered'] as const;

const STATUS_LABEL: Record<string, string> = {
  placed: 'Order placed',
  processing: 'Processing',
  delivered: 'Delivered',
};

const STATUS_HINT: Record<string, string> = {
  placed: 'We received your order.',
  processing: 'Preparing your items.',
  delivered: 'Your order has arrived.',
};

function statusIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === 'delivered') return 2;
  if (s === 'shipped' || s === 'processing' || s === 'confirmed') return 1;
  return 0;
}

export function OrderTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      const o = await fetchOrderByToken(token);
      if (!cancelled) {
        setOrder(o);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleDownloadReceipt = async () => {
    if (order) await downloadOrderReceipt(order);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Helmet>
        <title>
          {order
            ? `Order ${order.order_id} — Cimmple Hair`
            : 'Order tracking — Cimmple Hair'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="border-b border-[#e5e5e5] px-5 pb-4 pt-[84px] sm:px-8 sm:pt-[92px] lg:px-10">
        <Link
          to="/"
          className="text-[15px] font-bold uppercase tracking-[0.04em] leading-none text-black sm:text-[17px]"
        >
          Cimmple Hair<span className="text-rose">.</span>
        </Link>
      </div>

      <main className="flex-1 px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-48 skeleton" />
              <div className="h-4 w-32 skeleton" />
              <div className="mt-6 h-32 w-full skeleton" />
              <div className="h-32 w-full skeleton" />
            </div>
          ) : !order ? (
            <div className="mx-auto max-w-md text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose">
                Order not found
              </p>
              <h1 className="mt-3 text-[22px] font-bold uppercase leading-tight tracking-tight text-black sm:text-[26px]">
                We couldn't find this order
              </h1>
              <p className="mt-4 text-[13px] leading-[1.7] text-black/60 sm:text-[14px]">
                Double check the link, or view all your orders on this device.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Link
                  to="/my-orders"
                  className="inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-rose-deep"
                >
                  View my orders
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:border-rose hover:text-rose"
                >
                  Back home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose">
                    Order tracking
                  </p>
                  <h1 className="mt-2 text-[22px] font-bold uppercase leading-tight tracking-tight text-black sm:text-[26px]">
                    {order.order_id}
                  </h1>
                  <p className="mt-1.5 text-[12px] text-black/50">
                    {new Date(order.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {order.status === 'delivered' && (
                  <button
                    onClick={handleDownloadReceipt}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:border-rose hover:text-rose"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download receipt
                  </button>
                )}
              </div>

              {order.status !== 'cancelled' ? (
                <div className="mt-6 rounded-2xl border border-[#e5e5e5] bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 sm:gap-6">
                    {STATUS_STEPS.map((step, i) => {
                      const currentIdx = statusIndex(order.status);
                      const done = i <= currentIdx;
                      return (
                        <div key={step} className="flex flex-1 flex-col items-center text-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-colors sm:h-10 sm:w-10 sm:text-[13px] ${
                              done
                                ? 'border-rose bg-rose text-white'
                                : 'border-[#e5e5e5] bg-white text-black/30'
                            }`}
                          >
                            {done ? '✓' : i + 1}
                          </div>
                          <p
                            className={`mt-3 text-[11px] font-bold uppercase leading-tight tracking-[0.1em] sm:text-[12px] ${
                              done ? 'text-black' : 'text-black/40'
                            }`}
                          >
                            {STATUS_LABEL[step]}
                          </p>
                          <p
                            className={`mt-1 text-[10px] leading-[1.4] sm:text-[11px] ${
                              done ? 'text-black/55' : 'text-black/30'
                            }`}
                          >
                            {STATUS_HINT[step]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">
                    This order was cancelled
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[#e5e5e5] bg-white p-5 sm:p-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-black">
                  Items
                </h2>
                <ul className="mt-4 space-y-3.5">
                  {(Array.isArray(order.items) ? order.items : []).map(
                    (it: any, i: number) => {
                      const name = it?.name ?? 'Item';
                      const qty = it?.qty ?? it?.quantity ?? 1;
                      const price = it?.price ?? 0;
                      const variant = it?.variant ?? null;
                      const image = it?.image_url ?? null;

                      return (
                        <li key={i} className="flex items-center gap-3">
                          {image && (
                            <img
                              src={image}
                              alt={`${name} — Cimmple Hair`}
                              loading="lazy"
                              decoding="async"
                              className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                            />
                          )}
                          <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-medium uppercase tracking-[0.04em] text-black">
                                {name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-black/50">
                                Qty {qty}
                                {variant ? ` · ${variant}` : ''}
                              </p>
                            </div>
                            <p className="text-[12.5px] font-medium text-black">
                              {formatPrice(price * qty)}
                            </p>
                          </div>
                        </li>
                      );
                    }
                  )}
                </ul>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#e5e5e5] pt-5 sm:gap-8">
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-black">
                      Summary
                    </h2>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between gap-2 text-[11.5px] text-black/60 sm:text-[12px]">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-[11.5px] text-black/60 sm:text-[12px]">
                        <span>Shipping</span>
                        <span>{formatPrice(order.shipping_price)}</span>
                      </div>
                      <div className="flex justify-between gap-2 border-t border-[#e5e5e5] pt-2 text-[13.5px] font-bold text-black sm:text-[14px]">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                      <p className="pt-1 text-[10px] uppercase tracking-[0.14em] text-black/40 sm:text-[10.5px]">
                        {order.payment_method} · {order.payment_status}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-black">
                      Delivering to
                    </h2>
                    <div className="mt-3 text-[11.5px] leading-[1.6] text-black/70 sm:text-[12.5px]">
                      <p className="font-medium text-black">
                        {order.customer_name}
                      </p>
                      <p>{order.customer_phone}</p>
                      <p>
                        {order.address}
                        {order.apartment ? `, ${order.apartment}` : ''}
                      </p>
                      <p>
                        {order.city}, {order.state}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] px-3 py-5 text-center sm:gap-3 sm:px-4">
                <div>
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-rose">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-black sm:text-[9.5px] sm:tracking-[0.14em]">
                    Verified order
                  </p>
                </div>
                <div>
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-rose">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <path d="M16 8h4l3 3v5h-7V8zM5.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                    </svg>
                  </div>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-black sm:text-[9.5px] sm:tracking-[0.14em]">
                    Fast delivery
                  </p>
                </div>
                <div>
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-rose">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-black sm:text-[9.5px] sm:tracking-[0.14em]">
                    Support on WhatsApp
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href={`https://wa.me/2348000000000?text=${encodeURIComponent(
                    `Hi, I'm checking on my order ${order.order_id}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-rose px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-rose-deep"
                >
                  Message us about this order
                </a>
                <Link
                  to="/my-orders"
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:border-rose hover:text-rose"
                >
                  View all my orders
                </Link>
              </div>

              <p className="mt-8 text-center text-[10.5px] uppercase tracking-[0.14em] text-black/30">
                Cimmple Hair · Est. 2026
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}