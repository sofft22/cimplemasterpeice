import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Product, CartItem } from '../types';

interface AddOpts {
  silent?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity: number,
    variant?: string,
    variantPriceDelta?: number,
    opts?: AddOpts
  ) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const lineKey = (productId: string, variant?: string) => `${productId}::${variant ?? ''}`;
const STORAGE_KEY = 'cimmple_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const addToCart = useCallback(
    (
      product: Product,
      quantity: number,
      variant?: string,
      variantPriceDelta?: number,
      opts?: AddOpts
    ) => {
      setItems((prev) => {
        const key = lineKey(product.id, variant);
        const existing = prev.find((i) => lineKey(i.product.id, i.variant) === key);
        if (existing) {
          return prev.map((i) =>
            lineKey(i.product.id, i.variant) === key
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [
          ...prev,
          { product, quantity, variant, variantPriceDelta: variantPriceDelta ?? 0 },
        ];
      });

      // Fire-and-forget: log this add for Best Sellers tracking.
      // Never awaits, never blocks, never throws into the UI.
      supabase
        .from('cart_adds_log')
        .insert({ product_id: product.id })
        .then(
          () => {},
          () => {}
        );

      if (!opts?.silent) setIsCartOpen(true);
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variant?: string) => {
      const key = lineKey(productId, variant);
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => lineKey(i.product.id, i.variant) !== key)
          : prev.map((i) =>
              lineKey(i.product.id, i.variant) === key ? { ...i, quantity } : i
            )
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string, variant?: string) => {
    const key = lineKey(productId, variant);
    setItems((prev) => prev.filter((i) => lineKey(i.product.id, i.variant) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.product.price + (i.variantPriceDelta ?? 0)) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}