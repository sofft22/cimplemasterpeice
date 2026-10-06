import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLogin } from './Login';
import { AdminLayout, type AdminPage } from './AdminLayout';
import { AdminProducts } from './Products';
import { AdminProductForm } from './ProductForm';
import { AdminDashboard } from './Dashboard';
import { AdminOrders, type Order } from './AdminOrders';
import { AdminOrderDetail } from './AdminOrderDetail';
import { AdminReviews } from './AdminReviews';
import { AdminCoupons } from './AdminCoupons';
import { AdminSettings } from './AdminSettings';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';

type ProductsView = { kind: 'list' } | { kind: 'edit'; product: Product | null };
type OrdersView = { kind: 'list' } | { kind: 'detail'; order: Order };

export function AdminApp({ onExit }: { onExit: () => void }) {
  const { user, loading } = useAdminAuth();
  const [page, setPage] = useState<AdminPage>('dashboard');
  const [productsView, setProductsView] = useState<ProductsView>({ kind: 'list' });
  const [ordersView, setOrdersView] = useState<OrdersView>({ kind: 'list' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [counts, setCounts] = useState({ pendingOrders: 0, pendingReviews: 0 });

  useEffect(() => {
    if (!user) return;
    const loadCounts = async () => {
      const [ordersRes, reviewsRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('approved', false),
      ]);
      setCounts({
        pendingOrders: ordersRes.count ?? 0,
        pendingReviews: reviewsRes.count ?? 0,
      });
    };
    loadCounts();
  }, [user, refreshKey]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-pink-line border-t-rose" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onSuccess={() => setPage('dashboard')} />;
  }

  const handlePageChange = (p: AdminPage) => {
    setPage(p);
    setProductsView({ kind: 'list' });
    setOrdersView({ kind: 'list' });
  };

  return (
    <AdminLayout
      page={page}
      onPageChange={handlePageChange}
      onExit={onExit}
      pendingOrders={counts.pendingOrders}
      pendingReviews={counts.pendingReviews}
    >
      {page === 'dashboard' ? (
        <AdminDashboard onGoToOrders={() => handlePageChange('orders')} />
      ) : page === 'products' ? (
        productsView.kind === 'list' ? (
          <AdminProducts
            key={refreshKey}
            onCreate={() => setProductsView({ kind: 'edit', product: null })}
            onEdit={(p) => setProductsView({ kind: 'edit', product: p })}
          />
        ) : (
          <AdminProductForm
            product={productsView.product}
            onSaved={() => {
              setProductsView({ kind: 'list' });
              setRefreshKey((k) => k + 1);
            }}
            onCancel={() => setProductsView({ kind: 'list' })}
          />
        )
      ) : page === 'orders' ? (
        ordersView.kind === 'list' ? (
          <AdminOrders onOpenOrder={(o) => setOrdersView({ kind: 'detail', order: o })} />
        ) : (
          <AdminOrderDetail
            order={ordersView.order}
            onBack={() => setOrdersView({ kind: 'list' })}
            onUpdated={() => setRefreshKey((k) => k + 1)}
          />
        )
      ) : page === 'reviews' ? (
        <AdminReviews />
      ) : page === 'coupons' ? (
        <AdminCoupons />
      ) : page === 'settings' ? (
        <AdminSettings />
      ) : null}
    </AdminLayout>
  );
}