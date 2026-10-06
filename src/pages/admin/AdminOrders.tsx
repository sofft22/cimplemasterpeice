import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../config';
import { updateOrderStatus } from '../../lib/store';

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  apartment: string | null;
  city: string;
  state: string;
  shipping_axis: string | null;
  shipping_price: number;
  items: any;
  subtotal: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  onOpenOrder: (o: Order) => void;
}

type StatusFilter = 'new' | 'processing' | 'delivered' | 'all';
type DateRange = 'all' | 'today' | '7d' | '30d';

export function AdminOrders({ onOpenOrder }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('new');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...orders];

    if (status !== 'all') list = list.filter((o) => o.status === status);

    if (dateRange !== 'all') {
      const days = dateRange === 'today' ? 0 : dateRange === '7d' ? 7 : 30;
      const cutoff = new Date();
      if (days === 0) cutoff.setHours(0, 0, 0, 0);
      else cutoff.setDate(cutoff.getDate() - days);
      const iso = cutoff.toISOString();
      list = list.filter((o) => o.created_at >= iso);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_id.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, status, dateRange, query]);

  const counts = useMemo(
    () => ({
      new: orders.filter((o) => o.status === 'new').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      all: orders.length,
    }),
    [orders]
  );

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'delivered')
        .reduce((s, o) => s + (o.total ?? 0), 0),
    [orders]
  );

  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'new', label: 'New', count: counts.new },
    { id: 'processing', label: 'Processing', count: counts.processing },
    { id: 'delivered', label: 'Delivered', count: counts.delivered },
    { id: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {/* HEADER */}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose">
          Sales
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
          Orders
        </h1>
        <p className="mt-2 text-[13px] text-black/55">
          {counts.all} total
          {counts.new > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-rose">
                {counts.new} new
              </span>
            </>
          )}
          {revenue > 0 && (
            <>
              {' · '}
              {formatPrice(revenue)} delivered
            </>
          )}
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="mb-6 border-b border-[#eaeaea]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          {/* Text tabs */}
          <nav className="no-scrollbar flex flex-1 items-center gap-x-5 overflow-x-auto sm:gap-x-7">
            {tabs.map((t) => {
              const active = status === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setStatus(t.id)}
                  className={`relative shrink-0 pb-3 text-[12.5px] font-semibold transition-colors ${
                    active ? 'text-black' : 'text-black/45 hover:text-black'
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 text-[11.5px] font-medium ${
                      active ? 'text-rose' : 'text-black/35'
                    }`}
                  >
                    {t.count}
                  </span>
                  {active && (
                    <span className="absolute -bottom-[13px] left-0 h-[2px] w-full bg-rose" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: search + date range */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative w-full max-w-[220px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-[#eaeaea] bg-white py-2 pl-9 pr-3 text-[12.5px] text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
              />
            </div>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="rounded-full border border-[#eaeaea] bg-white px-3 py-2 text-[12px] font-medium text-black focus:border-rose focus:outline-none"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-[2.5px] border-rose/20 border-t-rose" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[13.5px] font-medium text-black/55">
            {orders.length === 0
              ? 'No orders yet.'
              : status === 'new'
              ? 'No new orders.'
              : 'No orders match.'}
          </p>
        </div>
      ) : (
        <ul>
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => onOpenOrder(o)}
                className="group flex w-full items-center gap-4 border-b border-[#f0f0f0] py-4 text-left transition-colors last:border-0 hover:bg-[#fafafa]"
              >
                {/* Order ID */}
                <div className="w-[110px] flex-shrink-0">
                  <p className="text-[13.5px] font-semibold text-black">
                    {o.order_id}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-black/45">
                    {new Date(o.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>

                {/* Customer */}
                <div className="hidden min-w-0 flex-1 sm:block">
                  <p className="truncate text-[13.5px] font-medium text-black">
                    {o.customer_name}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-black/45">
                    {o.customer_phone}
                  </p>
                </div>

                {/* On mobile, show customer under order id */}
                <div className="min-w-0 flex-1 sm:hidden">
                  <p className="truncate text-[13px] font-medium text-black">
                    {o.customer_name}
                  </p>
                </div>

                {/* Payment status */}
                <div className="hidden w-[90px] flex-shrink-0 md:block">
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        o.payment_status === 'paid'
                          ? 'bg-green-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span
                      className={
                        o.payment_status === 'paid'
                          ? 'text-green-700'
                          : 'text-amber-700'
                      }
                    >
                      {o.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </span>
                </div>

                {/* Status */}
                <div className="hidden w-[110px] flex-shrink-0 md:block">
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        o.status === 'delivered'
                          ? 'bg-green-500'
                          : o.status === 'processing'
                          ? 'bg-blue-500'
                          : 'bg-rose'
                      }`}
                    />
                    <span
                      className={
                        o.status === 'delivered'
                          ? 'text-green-700'
                          : o.status === 'processing'
                          ? 'text-blue-700'
                          : 'text-rose'
                      }
                    >
                      {o.status === 'new'
                        ? 'New'
                        : o.status === 'processing'
                        ? 'Processing'
                        : 'Delivered'}
                    </span>
                  </span>
                </div>

                {/* Total */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-[14px] font-semibold text-black">
                    {formatPrice(o.total)}
                  </p>
                </div>

                {/* Chevron */}
                <div className="flex-shrink-0 pl-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-3.5 w-3.5 text-black/25 transition-colors group-hover:text-rose"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}