import { useCart } from '../context/CartContext';
import { formatPrice } from '../config';

interface Props {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: Props) {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={closeCart}>
      <div className="absolute inset-0 bg-black/50" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-[420px] flex-col bg-white font-sans"
      >
        <div className="flex items-center justify-between border-b border-pink-line px-6 py-5">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.18em] text-black">
            Your bag {totalItems > 0 && `· ${totalItems}`}
          </h2>
          <button
            onClick={closeCart}
            className="text-[18px] leading-none text-black transition-colors duration-400 ease-premium hover:text-rose"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <p className="text-[13px] text-muted">Your bag is empty</p>
            <button
              onClick={closeCart}
              className="rounded-full border border-black px-7 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-black transition-colors duration-400 ease-premium hover:border-rose hover:text-rose"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-7">
              <div className="space-y-6">
                {items.map((item) => {
                  const linePrice = item.product.price + (item.variantPriceDelta ?? 0);
                  const key = `${item.product.id}::${item.variant ?? ''}`;

                  return (
                    <div key={key} className="flex gap-4 border-b border-pink-line pb-6 last:border-0">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden bg-pink-soft">
                        {item.product.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-[12px] font-medium uppercase tracking-[0.06em] text-black">
                          {item.product.name}
                        </h4>

                        {item.variant && (
                          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                            {item.variant}
                          </p>
                        )}

                        <p className="mt-2 text-[12.5px] text-black">{formatPrice(linePrice)}</p>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-pink-line">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                              className="flex h-8 w-8 items-center justify-center rounded-l-full text-black transition-colors duration-400 ease-premium hover:bg-pink-soft"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="flex h-8 w-8 items-center justify-center text-[12px] font-medium text-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                              className="flex h-8 w-8 items-center justify-center rounded-r-full text-black transition-colors duration-400 ease-premium hover:bg-pink-soft"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id, item.variant)}
                            className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted transition-colors duration-400 ease-premium hover:text-rose"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-pink-line px-6 py-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  Subtotal
                </span>
                <span className="text-[16px] font-medium text-black">{formatPrice(subtotal)}</span>
              </div>

              <button
                onClick={() => {
                  closeCart();
                  onCheckout();
                }}
                className="w-full rounded-full bg-rose py-4 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-400 ease-premium hover:bg-rose-deep"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}