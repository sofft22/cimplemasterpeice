import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../config';

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  total_orders: number;
  total_spent: number;
  notes: string | null;
  created_at: string;
}

interface OrderLite {
  id: string;
  order_id: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
}

type SortKey = 'recent' | 'spent';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [openCustomer, setOpenCustomer] = useState<Customer | null>(null);

  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [customersRes, ordersRes] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, order_id, customer_phone, total, status, created_at')
        .order('created_at', { ascending: false }),
    ]);
    setCustomers((customersRes.data ?? []) as Customer[]);
    setOrders((ordersRes.data ?? []) as OrderLite[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (openCustomer) setNotesDraft(openCustomer.notes ?? '');
  }, [openCustomer]);

  const filtered = useMemo(() => {
    let list = [...customers];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
    }
    if (sort === 'spent') list.sort((a, b) => b.total_spent - a.total_spent);
    return list;
  }, [customers, query, sort]);

  const allOnPageSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} customer${ids.length > 1 ? 's' : ''}?`)) return;
    setBusy(true);
    await supabase.from('customers').delete().in('id', ids);
    setBusy(false);
    setSelected(new Set());
    await load();
  };

  const saveNotes = async () => {
    if (!openCustomer) return;
    setSavingNotes(true);
    await supabase
      .from('customers')
      .update({ notes: notesDraft })
      .eq('id', openCustomer.id);
    setSavingNotes(false);
    setNotesSavedAt(Date.now());
    setTimeout(() => setNotesSavedAt(null), 2500);
    setCustomers((prev) =>
      prev.map((c) => (c.id === openCustomer.id ? { ...c, notes: notesDraft } : c))
    );
    setOpenCustomer({ ...openCustomer, notes: notesDraft });
  };

  const ordersFor = (phone: string) =>
    orders.filter((o) => o.customer_phone === phone);

  // ============================================
  // DETAIL VIEW
  // ============================================
  if (openCustomer) {
    const custOrders = ordersFor(openCustomer.phone);
    const hasNotesChanged = notesDraft !== (openCustomer.notes ?? '');

    return (
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <button
          onClick={() => setOpenCustomer(null)}
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/50 transition-colors hover:text-rose"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3 w-3">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to customers
        </button>

        {/* HEADER — matches Products page density */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose">
            Customer
          </p>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
            {openCustomer.name ?? 'Unnamed'}
          </h1>
          <p className="mt-2 text-[13px] font-medium text-black/50">
            {openCustomer.phone}
            {openCustomer.email && ` · ${openCustomer.email}`}
          </p>
        </div>

        <div className="max-w-3xl space-y-10">
          {/* OVERVIEW — flat key/value, no cards */}
          <section>
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-rose">
              Overview
            </h2>
            <dl className="divide-y divide-[#eaeaea] border-y border-[#eaeaea]">
              <Row label="Lifetime value" value={formatPrice(openCustomer.total_spent)} accent />
              <Row label="Orders" value={String(openCustomer.total_orders)} />
              <Row
                label="Avg order"
                value={formatPrice(
                  openCustomer.total_orders > 0
                    ? Math.round(openCustomer.total_spent / openCustomer.total_orders)
                    : 0
                )}
              />
              <Row
                label="Customer since"
                value={new Date(openCustomer.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              />
            </dl>

            <button
              onClick={() =>
                window.open(
                  `https://wa.me/${openCustomer.phone.replace(/\D/g, '')}`,
                  '_blank'
                )
              }
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-rose-deep"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23z" />
              </svg>
              Message on WhatsApp
            </button>
          </section>

          {/* NOTES */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose">
                Private notes
              </h2>
              {notesSavedAt && (
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-green-700">
                  ✓ Saved
                </span>
              )}
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={3}
              placeholder="Only you can see this. e.g. prefers WhatsApp, VIP customer…"
              className="w-full rounded-lg border border-[#eaeaea] bg-white px-4 py-3 text-[13.5px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={saveNotes}
                disabled={savingNotes || !hasNotesChanged}
                className="rounded-full bg-black px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep disabled:cursor-not-allowed disabled:opacity-30"
              >
                {savingNotes ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </section>

          {/* ORDER HISTORY — same table style as Products */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose">
                Order history
              </h2>
              <p className="text-[11.5px] font-medium text-black/45">
                {custOrders.length} total
              </p>
            </div>

            {custOrders.length === 0 ? (
              <p className="border-y border-[#eaeaea] py-8 text-center text-[13px] font-medium text-black/45">
                No orders yet.
              </p>
            ) : (
              <div className="border-t border-[#eaeaea]">
                {custOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-4 border-b border-[#eaeaea] py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-numbers text-[13px] text-black">
                        {o.order_id}
                      </p>
                      <p className="mt-0.5 text-[11.5px] font-medium text-black/50">
                        {new Date(o.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusPill status={o.status} />
                      <p className="font-numbers text-[13px] text-black">
                        {formatPrice(o.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ============================================
  // LIST VIEW
  // ============================================
  return (
    <div className="px-6 py-8 sm:px-10 sm:py-10">
      {/* HEADER — matches Products page exactly */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose">
            Community
          </p>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
            Customers
          </h1>
          <p className="mt-2 text-[13px] font-medium text-black/50">
            {customers.length} total · {filtered.length} showing
          </p>
        </div>
      </div>

      {/* CONTROLS ROW — tabs left, search right (same as Products) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#eaeaea] pb-3">
        <div className="flex items-center gap-6">
          {(
            [
              { id: 'recent' as const, label: 'Recent' },
              { id: 'spent' as const, label: 'Top spenders' },
            ]
          ).map((opt) => {
            const active = sort === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSort(opt.id)}
                className={`relative pb-3 text-[12.5px] font-semibold transition-colors ${
                  active ? 'text-rose' : 'text-black/50 hover:text-black'
                }`}
              >
                {opt.label}
                {active && (
                  <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-rose" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[220px] rounded-full border border-[#eaeaea] bg-white py-2 pl-9 pr-4 text-[12.5px] font-medium text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-[2px] border-rose/20 border-t-rose" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-[13px] font-medium text-black/45">
          {customers.length === 0
            ? 'No customers yet.'
            : 'No customers match your search.'}
        </p>
      ) : (
        <>
          {/* DESKTOP — flat table, same as Products */}
          <div className="hidden sm:block">
            <div className="flex items-center gap-4 border-b border-[#eaeaea] py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-rose">
              <div className="w-8">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  className="h-3.5 w-3.5 cursor-pointer accent-rose"
                  aria-label="Select all"
                />
              </div>
              <div className="flex-1">Customer</div>
              <div className="w-[220px]">Contact</div>
              <div className="w-16 text-right">Orders</div>
              <div className="w-28 text-right">Spent</div>
              <div className="w-32 text-right"></div>
            </div>

            {filtered.map((c) => {
              const isSelected = selected.has(c.id);
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-4 border-b border-[#eaeaea] py-3 transition-colors hover:bg-black/[0.015] ${
                    isSelected ? 'bg-rose/[0.03]' : ''
                  }`}
                >
                  <div className="w-8">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-rose"
                      aria-label={`Select ${c.name ?? c.phone}`}
                    />
                  </div>

                  <button
                    onClick={() => setOpenCustomer(c)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-rose/10 font-numbers text-[11.5px] text-rose">
                      {initials(c.name, c.phone)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-black">
                        {c.name ?? 'Unnamed'}
                      </p>
                      {c.notes && (
                        <p className="mt-0.5 truncate text-[11.5px] font-medium text-black/45">
                          {c.notes}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="w-[220px] min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-black/70">
                      {c.phone}
                    </p>
                    {c.email && (
                      <p className="mt-0.5 truncate text-[11.5px] font-medium text-black/40">
                        {c.email}
                      </p>
                    )}
                  </div>

                  <div className="w-16 text-right font-numbers text-[13px] text-black">
                    {c.total_orders}
                  </div>

                  <div className="w-28 text-right font-numbers text-[13px] text-black">
                    {formatPrice(c.total_spent)}
                  </div>

                  <div className="flex w-32 items-center justify-end gap-3">
                    <button
                      onClick={() => setOpenCustomer(c)}
                      className="text-[12px] font-semibold text-black/70 transition-colors hover:text-rose"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete([c.id])}
                      disabled={busy}
                      className="text-black/40 transition-colors hover:text-rose disabled:opacity-40"
                      aria-label="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MOBILE — flat rows */}
          <div className="sm:hidden">
            {filtered.map((c) => {
              const isSelected = selected.has(c.id);
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 border-b border-[#eaeaea] py-3 ${
                    isSelected ? 'bg-rose/[0.03]' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(c.id)}
                    className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-rose"
                    aria-label={`Select ${c.name ?? c.phone}`}
                  />
                  <button
                    onClick={() => setOpenCustomer(c)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-rose/10 font-numbers text-[11.5px] text-rose">
                      {initials(c.name, c.phone)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-black">
                        {c.name ?? 'Unnamed'}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] font-medium text-black/45">
                        {c.phone} · {c.total_orders} order
                        {c.total_orders === 1 ? '' : 's'}
                      </p>
                    </div>
                    <p className="font-numbers whitespace-nowrap text-[13px] text-black">
                      {formatPrice(c.total_spent)}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* BULK BAR */}
      {selected.size > 0 && (
        <div className="fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-[#eaeaea] bg-white px-5 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]">
          <p className="text-[12px] font-semibold text-black">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11.5px] font-semibold text-black/60 transition-colors hover:text-black"
            >
              Clear
            </button>
            <button
              onClick={() => handleDelete(Array.from(selected))}
              disabled={busy}
              className="rounded-full bg-rose px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep disabled:opacity-50"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-[12px] font-medium text-black/55">{label}</dt>
      <dd
        className={`font-numbers text-[13.5px] ${
          accent ? 'text-rose' : 'text-black'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] ${statusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function initials(name: string | null, phone: string) {
  const source = (name ?? '').trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || source[0].toUpperCase();
  }
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-2) || '?';
}

function statusColor(status: string) {
  switch (status) {
    case 'new':
      return 'bg-rose/15 text-rose';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'paid':
      return 'bg-blue-100 text-blue-800';
    case 'packed':
      return 'bg-yellow-100 text-yellow-800';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-rose/10 text-rose';
  }
}