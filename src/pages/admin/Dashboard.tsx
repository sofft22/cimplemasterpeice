import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../config';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Range = '7d' | '30d' | '90d';

interface StatBlock {
  rangeOrders: number;
  rangeRevenue: number;
  prevRangeRevenue: number;
  pendingOrders: number;
  pendingReviews: number;
  outOfStock: number;
}

interface RecentOrder {
  id: string;
  order_id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface Props {
  onGoToOrders: () => void;
  onGoToProducts?: () => void;
  onGoToReviews?: () => void;
}

const RANGE_DAYS: Record<Range, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function AdminDashboard({
  onGoToOrders,
  onGoToProducts,
  onGoToReviews,
}: Props) {
  const [stats, setStats] = useState<StatBlock | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const days = RANGE_DAYS[range];
      const rangeStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const prevStart = new Date(
        Date.now() - days * 2 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [
        rangeOrdersRes,
        rangeRevenueRes,
        prevRevenueRes,
        pendingOrdersRes,
        pendingReviewsRes,
        outOfStockRes,
        recentRes,
        allOrdersRes,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', rangeStart),
        supabase.from('orders').select('total').gte('created_at', rangeStart),
        supabase
          .from('orders')
          .select('total')
          .gte('created_at', prevStart)
          .lt('created_at', rangeStart),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new'),
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('approved', false),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('in_stock', false),
        supabase
          .from('orders')
          .select('id, order_id, customer_name, total, status, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('orders')
          .select('total, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      const sumRange = (rangeRevenueRes.data ?? []).reduce(
        (s, r: any) => s + (r.total ?? 0),
        0
      );
      const sumPrev = (prevRevenueRes.data ?? []).reduce(
        (s, r: any) => s + (r.total ?? 0),
        0
      );

      setStats({
        rangeOrders: rangeOrdersRes.count ?? 0,
        rangeRevenue: sumRange,
        prevRangeRevenue: sumPrev,
        pendingOrders: pendingOrdersRes.count ?? 0,
        pendingReviews: pendingReviewsRes.count ?? 0,
        outOfStock: outOfStockRes.count ?? 0,
      });
      setRecent((recentRes.data ?? []) as RecentOrder[]);

      const orders = (allOrdersRes.data ?? []) as any[];

      const byDay: Record<string, number> = {};
      orders.forEach((o) => {
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + (o.total ?? 0);
      });

      const rev: RevenuePoint[] = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        rev.push({ date: key, revenue: byDay[key] ?? 0 });
      }
      setRevenue(rev);

      setLoading(false);
    };
    load();
  }, [range]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-rose/20 border-t-rose" />
      </div>
    );
  }

  const chartDays = RANGE_DAYS[range];
  const visibleRevenue = revenue.slice(-Math.max(chartDays, 7));

  const rangeLabel =
    range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days';

  const delta =
    stats && stats.prevRangeRevenue > 0
      ? Math.round(
          ((stats.rangeRevenue - stats.prevRangeRevenue) /
            stats.prevRangeRevenue) *
            100
        )
      : null;
  const up = delta !== null && delta >= 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose">
            Cimmple Admin
          </p>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
            Dashboard
          </h1>
        </div>

        <div className="flex gap-0.5 rounded-lg bg-white p-0.5 shadow-sm">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors ${
                range === r
                  ? 'bg-rose text-white'
                  : 'text-black/50 hover:text-rose'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* REVENUE + ATTENTION */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
        {/* REVENUE — bold rose card */}
        <div className="relative overflow-hidden rounded-2xl bg-rose p-6 text-white lg:col-span-2">
          {/* decorative gradient */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
              Revenue · {rangeLabel}
            </p>
            <p className="mt-3 text-[36px] font-semibold leading-none tracking-tight sm:text-[42px]">
              {formatPrice(stats?.rangeRevenue ?? 0)}
            </p>
            <div className="mt-5 flex items-center gap-2.5 text-[12.5px]">
              {delta !== null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    up
                      ? 'bg-white/25 text-white'
                      : 'bg-black/20 text-white'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className={`h-2.5 w-2.5 ${up ? '' : 'rotate-180'}`}
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  {Math.abs(delta)}%
                </span>
              )}
              <span className="text-white/85">
                {stats?.rangeOrders ?? 0} orders
              </span>
            </div>
          </div>
        </div>

        <AttentionBlock
          label="Pending orders"
          value={stats?.pendingOrders ?? 0}
          onClick={onGoToOrders}
        />
        <AttentionBlock
          label="Pending reviews"
          value={stats?.pendingReviews ?? 0}
          onClick={onGoToReviews}
        />
      </div>

      {/* OUT OF STOCK — compact row */}
      <div className="mb-6 rounded-2xl border border-[#eaeaea] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose">
              Out of stock
            </span>
            <span className="text-[15px] font-semibold text-black">
              {stats?.outOfStock ?? 0}
            </span>
          </div>
          {onGoToProducts && (
            <button
              onClick={onGoToProducts}
              className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-rose hover:text-rose-deep"
            >
              Manage →
            </button>
          )}
        </div>
      </div>

      {/* CHART */}
      <div className="mb-6 rounded-2xl border border-[#eaeaea] bg-white p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-rose">
              Performance
            </p>
            <h2 className="mt-1.5 text-[15px] font-semibold text-black">
              Sales revenue
            </h2>
          </div>
          <p className="text-[12px] text-black/50">{rangeLabel}</p>
        </div>

        <div className="h-[220px] w-full sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visibleRevenue}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                contentStyle={{
                  background: '#0e0e0e',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  padding: '8px 12px',
                }}
                labelStyle={{
                  color: '#a8a8a8',
                  fontSize: '11px',
                  marginBottom: '2px',
                }}
                formatter={(value: any) => [formatPrice(value), 'Revenue']}
                labelFormatter={(label: any) => {
                  const d = new Date(label);
                  return d.toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#a63d5f"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#a63d5f',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-rose">
              Latest
            </p>
            <h2 className="mt-1.5 text-[15px] font-semibold text-black">
              Recent orders
            </h2>
          </div>
          <button
            onClick={onGoToOrders}
            className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-rose hover:text-rose-deep"
          >
            View all →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13.5px] font-medium text-black">
              No orders yet.
            </p>
            <p className="mt-1.5 text-[12.5px] text-black/50">
              Your first sale will show up here.
            </p>
          </div>
        ) : (
          <ul>
            {recent.map((o) => (
              <li key={o.id}>
                <button
                  onClick={onGoToOrders}
                  className="flex w-full items-center justify-between gap-4 border-b border-[#f2f2f2] py-4 text-left transition-colors last:border-0 hover:bg-[#fafafa]"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-black">
                      {o.order_id}
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] text-black/55">
                      {o.customer_name} ·{' '}
                      {new Date(o.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="text-[14px] font-semibold text-black">
                      {formatPrice(o.total)}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] ${statusColor(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AttentionBlock({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const active = value > 0;

  const className = `rounded-2xl border p-6 text-left transition-colors ${
    active
      ? 'border-rose/30 bg-rose/[0.05]'
      : 'border-[#eaeaea] bg-white'
  } ${onClick ? 'cursor-pointer hover:border-rose/50' : ''}`;

  const inner = (
    <>
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
          active ? 'text-rose' : 'text-black/50'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-3 text-[34px] font-semibold leading-none tracking-tight ${
          active ? 'text-rose' : 'text-black/20'
        }`}
      >
        {value}
      </p>
      {active && (
        <p className="mt-3 text-[11.5px] font-medium text-rose">
          Needs attention →
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

function statusColor(status: string) {
  switch (status) {
    case 'new':
      return 'bg-rose/10 text-rose';
    case 'delivered':
      return 'bg-green-50 text-green-700';
    case 'cancelled':
      return 'bg-red-50 text-red-700';
    case 'paid':
      return 'bg-blue-50 text-blue-700';
    case 'packed':
      return 'bg-yellow-50 text-yellow-700';
    case 'shipped':
      return 'bg-indigo-50 text-indigo-700';
    default:
      return 'bg-black/5 text-black/70';
  }
}