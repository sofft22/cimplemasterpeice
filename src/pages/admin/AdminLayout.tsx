import { useState, type ReactNode } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { BRAND } from '../../config';
import {
  IconDashboard,
  IconOrders,
  IconProducts,
  IconReviews,
  IconCoupons,
  IconSettings,
  IconSignOut,
} from './AdminIcons';

export type AdminPage =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'reviews'
  | 'coupons'
  | 'settings';

interface Props {
  page: AdminPage;
  onPageChange: (p: AdminPage) => void;
  onExit: () => void;
  children: ReactNode;
  pendingOrders?: number;
  pendingReviews?: number;
}

const NAV = [
  { id: 'dashboard' as const, label: 'Dashboard', Icon: IconDashboard },
  { id: 'orders' as const, label: 'Orders', Icon: IconOrders },
  { id: 'products' as const, label: 'Products', Icon: IconProducts },
  { id: 'coupons' as const, label: 'Coupons', Icon: IconCoupons },
  { id: 'reviews' as const, label: 'Reviews', Icon: IconReviews },
  { id: 'settings' as const, label: 'Settings', Icon: IconSettings },
];

const TAB_IDS: AdminPage[] = ['dashboard', 'orders', 'products', 'reviews'];
const MORE_IDS: AdminPage[] = ['coupons', 'settings'];

export function AdminLayout({
  page,
  onPageChange,
  onExit,
  children,
  pendingOrders = 0,
  pendingReviews = 0,
}: Props) {
  const { user, signOut } = useAdminAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onExit();
  };

  const badgeFor = (id: AdminPage) => {
    if (id === 'orders') return pendingOrders;
    if (id === 'reviews') return pendingReviews;
    return 0;
  };

  const moreIsActive = MORE_IDS.includes(page);

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-sans text-ink">
      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="hidden w-[240px] flex-shrink-0 flex-col border-r border-[#eaeaea] bg-white lg:flex">
        <div className="px-6 py-7">
          <p className="text-[17px] font-bold uppercase tracking-[0.02em] leading-none text-black">
            {BRAND.nameStrong}
            <span className="font-light text-black/60"> {BRAND.nameLight}</span>
            <span className="text-rose">.</span>
          </p>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-rose">
            Admin
          </p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {NAV.map(({ id, label, Icon }) => {
              const active = page === id;
              const badge = badgeFor(id);
              return (
                <li key={id}>
                  <button
                    onClick={() => onPageChange(id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                      active
                        ? 'bg-rose/[0.08] text-rose'
                        : 'text-black/70 hover:bg-black/[0.03] hover:text-black'
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px] flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span
                        className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                          active ? 'bg-rose text-white' : 'bg-rose/10 text-rose'
                        }`}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#eaeaea] px-6 py-5">
          <p className="truncate text-[12px] text-black/50">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-3 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-black/60 transition-colors hover:text-rose"
          >
            <IconSignOut className="h-[15px] w-[15px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#eaeaea] bg-white px-5 py-3.5 lg:hidden">
          <span className="w-9" />
          <p className="text-[15px] font-bold uppercase tracking-[0.02em] text-black">
            {BRAND.nameStrong}
            <span className="text-rose">.</span>
          </p>
          <button
            onClick={handleSignOut}
            className="w-9 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-black/60 transition-colors hover:text-rose"
          >
            Exit
          </button>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {moreOpen && (
          <div className="absolute bottom-full left-0 right-0 z-50 mb-3 px-3">
            <div className="overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]">
              {MORE_IDS.map((id, i) => {
                const item = NAV.find((n) => n.id === id)!;
                const active = page === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      onPageChange(id);
                      setMoreOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left text-[14px] font-medium transition-colors ${
                      active ? 'text-rose' : 'text-black/70'
                    } ${i < MORE_IDS.length - 1 ? 'border-b border-[#f2f2f2]' : ''}`}
                  >
                    <item.Icon className="h-[17px] w-[17px]" />
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {moreOpen && (
          <button
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
            className="absolute bottom-full left-0 right-0 z-40 h-screen cursor-default bg-black/20"
          />
        )}

        <div className="relative flex items-stretch border-t border-[#eaeaea] bg-white">
          {TAB_IDS.map((id) => {
            const item = NAV.find((n) => n.id === id)!;
            const active = page === id;
            const badge = badgeFor(id);
            return (
              <button
                key={id}
                onClick={() => {
                  onPageChange(id);
                  setMoreOpen(false);
                }}
                aria-label={item.label}
                className={`relative flex flex-1 items-center justify-center py-3.5 ${
                  active ? 'text-rose' : 'text-black/50'
                }`}
              >
                <item.Icon className="h-[21px] w-[21px]" />
                {badge > 0 && (
                  <span className="absolute right-[22%] top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More"
            className={`relative flex flex-1 items-center justify-center py-3.5 ${
              moreOpen || moreIsActive ? 'text-rose' : 'text-black/50'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[21px] w-[21px]">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}