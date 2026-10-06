import { useState } from 'react';
import { formatPrice } from '../../config';
import { updateOrderStatus } from '../../lib/store';
import type { Order } from './AdminOrders';

interface Props {
  order: Order;
  onBack: () => void;
  onUpdated: () => void;
}

const STATUS_FLOW = ['new', 'processing', 'delivered'] as const;
type Status = typeof STATUS_FLOW[number];

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  processing: 'Processing',
  delivered: 'Delivered',
};

const STATUS_DOT: Record<Status, string> = {
  new: 'bg-rose',
  processing: 'bg-blue-500',
  delivered: 'bg-green-500',
};

export function AdminOrderDetail({ order, onBack, onUpdated }: Props) {
  const [status, setStatus] = useState<Status>(
    (STATUS_FLOW.includes(order.status as Status) ? order.status : 'new') as Status
  );
  const [saving, setSaving] = useState(false);

  const items = Array.isArray(order.items) ? order.items : [];

  const fullAddress = `${order.address}${
    order.apartment ? ', ' + order.apartment : ''
  }, ${order.city}, ${order.state}`;

  const computedDiscount = Math.max(
    0,
    (order.subtotal ?? 0) + (order.shipping_price ?? 0) - (order.total ?? 0)
  );
  const hasDiscount = computedDiscount > 0;

  const setTo = async (next: Status) => {
    if (next === status || saving) return;
    setStatus(next);
    setSaving(true);
    await updateOrderStatus(order.id, next);
    setSaving(false);
    onUpdated();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openWhatsApp = () => {
    const msg = `Hi ${order.customer_name}, this is Cimmple regarding your order ${order.order_id}.`;
    window.open(
      `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const currentIdx = STATUS_FLOW.indexOf(status);
  const nextStatus = STATUS_FLOW[currentIdx + 1] ?? null;
  const prevStatus = STATUS_FLOW[currentIdx - 1] ?? null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {/* BACK */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-black/50 transition-colors hover:text-rose"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3.5 w-3.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to orders
      </button>

      {/* ORDER HEADER */}
      <div className="border-b border-[#eaeaea] pb-6">
        <p className="text-[11.5px] text-black/45">
          {new Date(order.created_at).toLocaleString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-black sm:text-[32px]">
          {order.order_id}
        </h1>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* CUSTOMER */}
          <section className="border-b border-[#eaeaea] pb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Customer
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-[14.5px] font-medium text-black">
                {order.customer_name}
              </p>
              <p className="text-[13.5px] text-black/60">
                {order.customer_phone}
              </p>
              {order.customer_email && (
                <p className="text-[13.5px] text-black/60">
                  {order.customer_email}
                </p>
              )}
            </div>

            <button
              onClick={openWhatsApp}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-rose-deep"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
              </svg>
              Message {order.customer_name.split(' ')[0]}
            </button>
          </section>

          {/* DELIVERY */}
          <section className="border-b border-[#eaeaea] pb-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
                Delivery
              </p>
              <button
                onClick={() => copy(fullAddress)}
                className="text-[11.5px] font-medium text-rose transition-colors hover:text-rose-deep"
              >
                Copy address
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-[14px] font-medium text-black">
                {order.address}
                {order.apartment ? `, ${order.apartment}` : ''}
              </p>
              <p className="text-[13.5px] text-black/60">
                {order.city}, {order.state}
              </p>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="pb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Payment
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[14px] font-medium text-black">
                {order.payment_method === 'paystack'
                  ? 'Card'
                  : order.payment_method === 'transfer'
                  ? 'Bank transfer'
                  : 'Pay on delivery'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    order.payment_status === 'paid'
                      ? 'bg-green-500'
                      : 'bg-amber-500'
                  }`}
                />
                <span
                  className={
                    order.payment_status === 'paid'
                      ? 'text-green-700'
                      : 'text-amber-700'
                  }
                >
                  {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </span>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* STATUS */}
          <section className="border-b border-[#eaeaea] pb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Status
            </p>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              <span className="text-[14.5px] font-semibold text-black">
                {STATUS_LABEL[status]}
              </span>
              {saving && (
                <span className="ml-1 text-[11.5px] font-medium text-black/40">
                  saving…
                </span>
              )}
            </div>
          </section>

          {/* ITEMS + TOTALS */}
          <section className="border-b border-[#eaeaea] pb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Items
            </p>

            <ul className="mt-3 space-y-3">
              {items.map((it: any, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  {it.image_url && (
                    <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-[#fbeef1]">
                      <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-black">
                      {it.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-black/50">
                      Qty {it.qty}
                      {it.variant ? ` · ${it.variant}` : ''}
                    </p>
                  </div>
                  <p className="flex-shrink-0 text-[13.5px] font-medium text-black">
                    {formatPrice((it.price ?? 0) * (it.qty ?? 1))}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-black/55">Subtotal</span>
                <span className="text-black">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-rose">Discount</span>
                  <span className="text-rose">
                    -{formatPrice(computedDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-black/55">Shipping</span>
                <span className="text-black">
                  {formatPrice(order.shipping_price)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-[#eaeaea] pt-3">
                <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-black/60">
                  Total
                </span>
                <span className="text-[20px] font-semibold text-black">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <section>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Actions
            </p>

            {nextStatus && (
              <button
                onClick={() => setTo(nextStatus)}
                disabled={saving}
                className="flex w-full items-center justify-between gap-3 rounded-xl bg-rose px-5 py-4 text-left text-[14px] font-semibold text-white transition-colors hover:bg-rose-deep disabled:opacity-60"
              >
                <span>Mark as {STATUS_LABEL[nextStatus]}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-4 w-4">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {!nextStatus && status === 'delivered' && (
              <div className="rounded-xl bg-green-50 px-5 py-4 text-center text-[13.5px] font-semibold text-green-700">
                ✓ This order is complete
              </div>
            )}

            {prevStatus && (
              <button
                onClick={() => setTo(prevStatus)}
                disabled={saving}
                className="mt-3 text-[12px] font-medium text-black/45 transition-colors hover:text-rose"
              >
                ← Move back to {STATUS_LABEL[prevStatus]}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function statusActiveStyle(status: string) {
  switch (status) {
    case 'new':
      return 'border-rose bg-rose text-white';
    case 'delivered':
      return 'border-green-600 bg-green-600 text-white';
    case 'cancelled':
      return 'border-red-600 bg-red-600 text-white';
    default:
      return 'border-rose bg-rose text-white';
  }
}