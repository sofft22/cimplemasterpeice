import { useState, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutSheet } from './components/CheckoutSheet';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MinDelaySuspense } from './components/MinDelaySuspense';

/* Fire the products fetch the moment JS parses — before any route renders.
   The cache dedupes it, so the page that mounts a moment later gets the
   same in-flight promise instead of firing a second request. */
import { loadProducts } from './lib/products-cache';
import { fetchPublicProducts } from './lib/store';
loadProducts(() => fetchPublicProducts());

const StorePage = lazy(() =>
  import('./pages/StorePage').then((m) => ({ default: m.StorePage }))
);
const ShopPage = lazy(() =>
  import('./pages/ShopPage').then((m) => ({ default: m.ShopPage }))
);
const OrderTrackingPage = lazy(() =>
  import('./pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage }))
);
const MyOrdersPage = lazy(() =>
  import('./pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const AdminApp = lazy(() =>
  import('./pages/admin/AdminApp').then((m) => ({ default: m.AdminApp }))
);

function StoreShell({ page }: { page: 'store' | 'shop' }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <CartProvider>
      <MinDelaySuspense>
        {page === 'shop' ? <ShopPage /> : <StorePage />}
      </MinDelaySuspense>
      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </CartProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ErrorBoundary>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<StoreShell page="store" />} />
          <Route path="/shop" element={<StoreShell page="shop" />} />

          <Route
            path="/order/:token"
            element={
              <CartProvider>
                <MinDelaySuspense>
                  <OrderTrackingPage />
                </MinDelaySuspense>
              </CartProvider>
            }
          />

          <Route
            path="/my-orders"
            element={
              <CartProvider>
                <MinDelaySuspense>
                  <MyOrdersPage />
                </MinDelaySuspense>
              </CartProvider>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminAuthProvider>
                <MinDelaySuspense>
                  <AdminApp
                    onExit={() => {
                      window.location.href = '/';
                    }}
                  />
                </MinDelaySuspense>
              </AdminAuthProvider>
            }
          />

          <Route
            path="*"
            element={
              <CartProvider>
                <MinDelaySuspense>
                  <NotFoundPage />
                </MinDelaySuspense>
              </CartProvider>
            }
          />
        </Routes>
      </ErrorBoundary>
    </SettingsProvider>
  );
}