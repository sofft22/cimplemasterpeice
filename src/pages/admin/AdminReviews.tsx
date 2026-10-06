import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

type Filter = 'pending' | 'approved' | 'all';

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [reviewsRes, productsRes] = await Promise.all([
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name'),
    ]);
    setReviews((reviewsRes.data ?? []) as Review[]);
    const map: Record<string, string> = {};
    (productsRes.data ?? []).forEach((p: any) => {
      map[p.id] = p.name;
    });
    setProducts(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'pending') return reviews.filter((r) => !r.approved);
    if (filter === 'approved') return reviews.filter((r) => r.approved);
    return reviews;
  }, [reviews, filter]);

  const setApproved = async (ids: string[], approved: boolean) => {
    if (ids.length === 0) return;
    setBusy(true);
    await supabase.from('reviews').update({ approved }).in('id', ids);
    setBusy(false);
    await load();
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} review${ids.length > 1 ? 's' : ''}?`)) return;
    setBusy(true);
    await supabase.from('reviews').delete().in('id', ids);
    setBusy(false);
    await load();
  };

  const pendingCount = reviews.filter((r) => !r.approved).length;
  const approvedCount = reviews.length - pendingCount;

  return (
    <div className="px-6 py-8 sm:px-10 sm:py-10">
      {/* ============ HEADER ============ */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose">
          Community
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
          Reviews
        </h1>
        <p className="mt-2 text-[13px] font-medium text-black/50">
          {reviews.length} total · {approvedCount} approved
        </p>
      </div>

      {/* ============ FILTER TABS — plain text, no pills ============ */}
      <div className="mb-8 flex items-center gap-8">
        {(['pending', 'approved', 'all'] as Filter[]).map((f) => {
          const active = filter === f;
          const count =
            f === 'pending'
              ? pendingCount
              : f === 'approved'
              ? approvedCount
              : reviews.length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-baseline gap-2 text-[13.5px] transition-colors ${
                active
                  ? 'font-bold text-black'
                  : 'font-medium text-black/45 hover:text-black'
              }`}
            >
              <span className="capitalize">{f}</span>
              <span
                className={`text-[12px] ${
                  active ? 'text-rose' : 'text-black/35'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============ CONTENT ============ */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-[2px] border-rose/20 border-t-rose" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-[13px] font-medium text-black/45">
          {filter === 'pending' ? 'No reviews waiting.' : 'No reviews yet.'}
        </p>
      ) : (
        <>
          {/* ============ DESKTOP — flat table ============ */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-6 border-b border-[#eaeaea] py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-rose">
              <div className="w-[160px]">Customer</div>
              <div className="w-[180px]">Product</div>
              <div className="w-[130px]">Rating</div>
              <div className="min-w-0 flex-1">Comment</div>
              <div className="w-[130px]">Status</div>
              <div className="w-[70px]">Date</div>
              <div className="w-[110px] text-right"></div>
            </div>

            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-6 border-b border-[#eaeaea] py-5 transition-colors hover:bg-black/[0.015]"
              >
                <div className="w-[160px] min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-black">
                    {r.customer_name}
                  </p>
                </div>

                <div className="w-[180px] min-w-0">
                  <p className="truncate text-[13px] font-medium text-black/55">
                    {products[r.product_id] ?? 'Unknown'}
                  </p>
                </div>

                <div className="w-[130px]">
                  <span className="text-[13px] tracking-[0.05em] text-rose">
                    {'★'.repeat(r.rating)}
                    <span className="text-black/15">
                      {'★'.repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-black/70">
                    "{r.comment}"
                  </p>
                </div>

                <div className="w-[130px]">
                  {r.approved ? (
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                      Pending
                    </span>
                  )}
                </div>

                <div className="w-[70px] text-[12px] font-medium text-black/50">
                  {new Date(r.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>

                <div className="flex w-[110px] flex-col items-end gap-1">
                  {!r.approved ? (
                    <button
                      onClick={() => setApproved([r.id], true)}
                      disabled={busy}
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose transition-colors hover:text-rose-deep disabled:opacity-50"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => setApproved([r.id], false)}
                      disabled={busy}
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose transition-colors hover:text-rose-deep disabled:opacity-50"
                    >
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete([r.id])}
                    disabled={busy}
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose transition-colors hover:text-rose-deep disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ============ MOBILE — flat rows ============ */}
          <div className="lg:hidden">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="border-b border-[#eaeaea] py-5 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[13.5px] font-medium text-black">
                    {r.customer_name}
                  </p>
                  <span className="text-[12px] tracking-[0.05em] text-rose">
                    {'★'.repeat(r.rating)}
                    <span className="text-black/15">
                      {'★'.repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] font-medium text-black/50">
                  on{' '}
                  <span className="text-rose">
                    {products[r.product_id] ?? 'Unknown'}
                  </span>
                  {' · '}
                  {new Date(r.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="mt-3 text-[13px] leading-[1.6] text-black/85">
                  "{r.comment}"
                </p>
                <div className="mt-3 flex items-center gap-5">
                  {!r.approved ? (
                    <button
                      onClick={() => setApproved([r.id], true)}
                      disabled={busy}
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose hover:text-rose-deep"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => setApproved([r.id], false)}
                      disabled={busy}
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose hover:text-rose-deep"
                    >
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete([r.id])}
                    disabled={busy}
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose hover:text-rose-deep"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}