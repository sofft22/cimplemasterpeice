import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice, generateOrderId } from '../config';
import { NIGERIAN_STATES } from '../lib/data';
import {
  createOrder,
  validateCoupon,
  calculateDiscount,
  incrementCouponUse,
  normalizePhone,
  isValidNigerianPhone,
  zoneForState,
  type Coupon,
} from '../lib/store';
import { FakePaystack } from './FakePaystack';

const LS_KEY = 'cimmple_my_orders_v1';

function saveOrderLocally(order: { token: string; orderId: string; date: string }) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(list)
      ? list.filter((o: any) => o?.token !== order.token)
      : [];
    filtered.unshift(order);
    localStorage.setItem(LS_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore
  }
}

type PaymentMethod = 'paystack' | 'transfer' | 'delivery';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CheckoutSheet({ open, onClose }: Props) {
  const { settings } = useSettings();
  const { items, subtotal, clearCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── form state ──────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [axisId, setAxisId] = useState(settings.lagos_axes[0]?.id ?? '');
  const [payment, setPayment] = useState<PaymentMethod | null>(null);

  // ─── coupon state ────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // ─── flow state ──────────────────────────────────────────
  const [showFakePaystack, setShowFakePaystack] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedToken, setPlacedToken] = useState<string | null>(null);
  const [placedMethod, setPlacedMethod] = useState<PaymentMethod | null>(null);
  const [placedTotal, setPlacedTotal] = useState<number>(0);
  const [placedZoneName, setPlacedZoneName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderError, setOrderError] = useState('');

  // ─── phone validation ────────────────────────────────────
  useEffect(() => {
    if (!phone) {
      setPhoneError('');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setPhoneError('Enter a valid Nigerian number (e.g. 08012345678)');
    } else {
      setPhoneError('');
    }
  }, [phone]);

  // ─── scroll to top when flow changes ─────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [placedOrderId]);

  // ─── shipping ────────────────────────────────────────────
  const shipping = useMemo(() => {
    if (state === 'Lagos') {
      const axis = settings.lagos_axes.find((a) => a.id === axisId);
      return axis?.price ?? 0;
    }
    const zone = zoneForState(state, settings.shipping_zones);
    return zone?.price ?? 0;
  }, [state, axisId, settings.lagos_axes, settings.shipping_zones]);

  const zoneName = useMemo(() => {
    if (state === 'Lagos') return null;
    const zone = zoneForState(state, settings.shipping_zones);
    return zone?.name ?? null;
  }, [state, settings.shipping_zones]);

  const { discount, shippingAfter } = useMemo(() => {
    if (!appliedCoupon) return { discount: 0, shippingAfter: shipping };
    return calculateDiscount(appliedCoupon, subtotal, shipping);
  }, [appliedCoupon, subtotal, shipping]);

  const total = Math.max(0, subtotal - discount) + shippingAfter;

  // ─── can submit? ─────────────────────────────────────────
  const canSubmit = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      isValidNigerianPhone(phone) &&
      email.trim().includes('@') &&
      address.trim() &&
      city.trim() &&
      payment !== null &&
      shipping > 0
  );

  // ─── coupon apply ────────────────────────────────────────
  const handleApplyCoupon = async () => {
    setCouponError('');
    setAppliedCoupon(null);

    if (!couponCode.trim()) {
      setCouponError('Enter a code');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setCouponError('Enter a valid phone number above first');
      return;
    }

    setCouponLoading(true);
    const { coupon, error } = await validateCoupon(
      couponCode,
      subtotal,
      normalizePhone(phone)
    );
    setCouponLoading(false);

    if (error || !coupon) {
      setCouponError(error ?? 'Invalid code');
      return;
    }
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code.toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // ─── place order ─────────────────────────────────────────
  const placeOrder = async (method: PaymentMethod) => {
    if (submitting) return;
    setOrderError('');
    setSubmitting(true);

    const normalizedPhone = normalizePhone(phone);

    // Re-validate coupon right before insert if one is applied
    let finalDiscount = discount;
    let finalCoupon: Coupon | null = appliedCoupon;

    if (appliedCoupon) {
      const { coupon: fresh, error } = await validateCoupon(
        appliedCoupon.code,
        subtotal,
        normalizedPhone
      );
      if (error || !fresh) {
        finalCoupon = null;
        finalDiscount = 0;
      } else {
        finalCoupon = fresh;
      }
    }

    const finalShippingAfter =
      finalCoupon?.type === 'shipping' ? 0 : shipping;

    const finalTotal =
      Math.max(0, subtotal - finalDiscount) + finalShippingAfter;

    const orderId = generateOrderId();
    const fullName = `${firstName} ${lastName}`.trim();

    const itemsForDb = items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      variant: i.variant ?? null,
      qty: i.quantity,
      price: i.product.price + (i.variantPriceDelta ?? 0),
      image_url: i.product.image_url,
    }));

    const { error, tracking_token } = await createOrder({
      order_id: orderId,
      customer_name: fullName,
      customer_phone: normalizedPhone,
      customer_email: email.trim() || null,
      address: address.trim(),
      apartment: apartment.trim() || null,
      city: city.trim(),
      state,
      shipping_axis: state === 'Lagos' ? axisId : null,
      shipping_price: finalShippingAfter,
      items: itemsForDb,
      subtotal,
      total: finalTotal,
      payment_method: method,
      payment_status: method === 'paystack' ? 'paid' : 'pending',
      status: 'new',
      notes: null,
      coupon_code: finalCoupon?.code ?? null,
      discount_amount: finalDiscount || null,
    });

    if (error) {
      setOrderError('Something went wrong placing your order. Please try again.');
      setSubmitting(false);
      return;
    }

    if (tracking_token) {
      saveOrderLocally({
        token: tracking_token,
        orderId,
        date: new Date().toISOString(),
      });
    }

    if (finalCoupon) {
      await incrementCouponUse(finalCoupon.id);
    }

    setPlacedOrderId(orderId);
    setPlacedToken(tracking_token ?? null);
    setPlacedMethod(method);
    setPlacedTotal(finalTotal);
    setPlacedZoneName(zoneName);
    setSubmitting(false);
    clearCart();
  };

  // ─── whatsapp message ────────────────────────────────────
  const buildWhatsAppMessage = (
    method: PaymentMethod,
    totalOverride: number,
    orderId: string,
    token: string | null
  ) => {
    const lines = items
      .map((i) => {
        const variant = i.variant ? ` (${i.variant})` : '';
        const lineTotal =
          (i.product.price + (i.variantPriceDelta ?? 0)) * i.quantity;
        return `• ${i.product.name}${variant} × ${i.quantity} — ${formatPrice(lineTotal)}`;
      })
      .join('\n');

    const trackingUrl = token
      ? `${window.location.origin}/order/${token}`
      : '';

    const discountLine = appliedCoupon
      ? appliedCoupon.type === 'shipping'
        ? `Discount: Free shipping (${appliedCoupon.code})\n`
        : `Discount: -${formatPrice(discount)} (${appliedCoupon.code})\n`
      : '';

    const methodLabel =
      method === 'paystack'
        ? 'Paid online'
        : method === 'transfer'
        ? 'Bank transfer'
        : 'Pay on delivery';

    return (
      `Hi Cimmple, I've placed an order:\n\n` +
      `Order ID: ${orderId}\n` +
      `${lines}\n\n` +
      `Subtotal: ${formatPrice(subtotal)}\n` +
      discountLine +
      `Shipping: ${formatPrice(shippingAfter)}\n` +
      `Total: ${formatPrice(totalOverride)}\n\n` +
      `Name: ${firstName} ${lastName}\n` +
      `Phone: ${normalizePhone(phone)}\n` +
      `Address: ${address}${apartment ? ', ' + apartment : ''}, ${city}, ${state}\n\n` +
      `Payment: ${methodLabel}` +
      (trackingUrl ? `\n\nTrack my order: ${trackingUrl}` : '') +
      (method === 'transfer'
        ? `\n\n📎 I'm attaching my receipt now.`
        : '')
    );
  };

  const handleSendWhatsApp = (method: PaymentMethod) => {
    if (!placedOrderId) return;
    const msg = buildWhatsAppMessage(
      method,
      placedTotal,
      placedOrderId,
      placedToken
    );
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const handlePayNow = () => {
    if (!canSubmit || !payment) return;
    if (payment === 'paystack') {
      setShowFakePaystack(true);
    } else {
      placeOrder(payment);
    }
  };

  // ─── reset form ──────────────────────────────────────────
  const resetForm = () => {
    setPlacedOrderId(null);
    setPlacedToken(null);
    setPlacedMethod(null);
    setPlacedTotal(0);
    setPlacedZoneName(null);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setOrderError('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPhoneError('');
    setAddress('');
    setApartment('');
    setCity('');
    setState('Lagos');
    setAxisId(settings.lagos_axes[0]?.id ?? '');
    setPayment(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopyTracking = async () => {
    if (!placedToken) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/order/${placedToken}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(
        'Copy this link:',
        `${window.location.origin}/order/${placedToken}`
      );
    }
  };

  if (!open) return null;

  const paymentOptions = [
    settings.payment_paystack_enabled && {
      id: 'paystack' as const,
      label: 'Pay now with card',
      sub: 'Secure card payment',
    },
    settings.payment_transfer_enabled && {
      id: 'transfer' as const,
      label: 'Bank Transfer',
      sub: 'Transfer and send proof on WhatsApp',
    },
    settings.payment_delivery_enabled && {
      id: 'delivery' as const,
      label: 'Pay on delivery',
      sub: 'Pay when it arrives',
    },
  ].filter(Boolean) as { id: PaymentMethod; label: string; sub: string }[];

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col bg-white sm:max-w-[560px]"
      >
        {/* HEADER */}
        <div
          className="flex flex-shrink-0 items-center justify-between border-b border-[#eaeaea] px-6 py-5"
          style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
          <h2 className="text-[18px] font-semibold tracking-tight text-black">
            {placedOrderId ? 'Order placed' : 'Checkout'}
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        {/* CONTENT */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {placedOrderId ? (
            <PlacedScreen
              orderId={placedOrderId}
              token={placedToken}
              method={placedMethod!}
              total={placedTotal}
              zoneName={placedZoneName}
              bankName={settings.bank_name}
              bankAccountName={settings.bank_account_name}
              bankAccountNumber={settings.bank_account_number}
              copied={copied}
              onCopyTracking={handleCopyTracking}
              onSendWhatsApp={() => handleSendWhatsApp(placedMethod!)}
              onClose={handleClose}
            />
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-14 text-center">
              <p className="text-[14px] text-black/60">Your bag is empty.</p>
              <button
                onClick={handleClose}
                className="rounded-full border border-black px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:border-rose hover:text-rose"
              >
                Back to shop
              </button>
            </div>
          ) : (
            <div className="px-6 py-6">
              {/* ── ORDER SUMMARY ─────────────────────────── */}
              <section className="rounded-2xl border border-[#eaeaea] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                    Order summary
                  </h3>
                  <span className="text-[11.5px] font-medium text-black/50">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {items.map((item) => {
                    const key = `${item.product.id}::${item.variant ?? ''}`;
                    const line =
                      (item.product.price + (item.variantPriceDelta ?? 0)) *
                      item.quantity;
                    return (
                      <div key={key} className="flex gap-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#fbeef1]">
                          {item.product.image_url && (
                            <img
                              src={item.product.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-medium text-black">
                            {item.product.name}
                          </p>
                          {item.variant && (
                            <p className="mt-0.5 text-[11.5px] text-black/50">
                              {item.variant}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11.5px] text-black/50">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-[13px] font-medium text-black">
                          {formatPrice(line)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* COUPON */}
                <div className="mt-5 border-t border-[#eaeaea] pt-5">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose">
                          {appliedCoupon.code}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-black/60">
                          {appliedCoupon.type === 'shipping'
                            ? 'Free shipping applied'
                            : appliedCoupon.type === 'percent'
                            ? `${appliedCoupon.value}% off`
                            : `₦${appliedCoupon.value.toLocaleString('en-NG')} off`}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/50 transition-colors hover:text-rose"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/50">
                        Discount code
                      </label>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder="Enter code"
                          className="flex-1 rounded-xl border border-[#eaeaea] bg-white px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose disabled:opacity-50"
                        >
                          {couponLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-[11.5px] font-medium text-red-600">
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* TOTALS */}
                <div className="mt-5 space-y-2.5 border-t border-[#eaeaea] pt-5 text-[13px]">
                  <div className="flex justify-between text-black/60">
                    <span>Subtotal</span>
                    <span className="text-black">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rose">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-black/60">
                    <span>Shipping</span>
                    <span className="text-black">
                      {shippingAfter === 0 && appliedCoupon?.type === 'shipping'
                        ? 'Free'
                        : formatPrice(shippingAfter)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#eaeaea] pt-3 text-[15px] font-semibold text-black">
                    <span>Total</span>
                    <span className="font-numbers text-[18px]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </section>

              {/* ── 1 · CONTACT ─────────────────────────── */}
              <section className="mt-8">
                <SectionHeader number="1" title="Contact" />
                <div className="mt-4 space-y-3">
                  <Field label="Email">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field
                    label="Phone"
                    error={phoneError}
                    hint="We'll use this to reach you on WhatsApp"
                  >
                    <input
                      type="tel"
                      placeholder="08012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`input ${phoneError ? 'border-red-300 focus:border-red-500' : ''}`}
                    />
                  </Field>
                </div>
              </section>

              {/* ── 2 · DELIVERY ─────────────────────────── */}
              <section className="mt-8">
                <SectionHeader number="2" title="Delivery" />
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name">
                      <input
                        type="text"
                        placeholder="Ada"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="input"
                      />
                    </Field>
                    <Field label="Last name">
                      <input
                        type="text"
                        placeholder="Okafor"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="input"
                      />
                    </Field>
                  </div>
                  <Field label="Street address">
                    <input
                      type="text"
                      placeholder="12 Admiralty Way"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="Apartment / suite" optional>
                    <input
                      type="text"
                      placeholder="Flat 3B, second gate"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="input"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                      <input
                        type="text"
                        placeholder="Lekki"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input"
                      />
                    </Field>
                    <Field label="State">
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="input"
                      >
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                {/* LAGOS AXIS */}
                {state === 'Lagos' && settings.lagos_axes.length > 0 && (
                  <div className="mt-5">
                    <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/50">
                      Lagos zone
                    </label>
                    <div className="mt-2 space-y-2">
                      {settings.lagos_axes.map((axis) => {
                        const active = axisId === axis.id;
                        return (
                          <label
                            key={axis.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                              active
                                ? 'border-rose bg-rose/5'
                                : 'border-[#eaeaea] hover:border-rose/40'
                            }`}
                          >
                            <input
                              type="radio"
                              name="axis"
                              checked={active}
                              onChange={() => setAxisId(axis.id)}
                              className="mt-1 accent-rose"
                            />
                            <div className="flex-1">
                              <p className="text-[12.5px] leading-relaxed text-black">
                                {axis.label}
                              </p>
                            </div>
                            <p className="font-numbers whitespace-nowrap text-[13px] text-black">
                              {formatPrice(axis.price)}
                            </p>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* NON-LAGOS ZONE INFO */}
                {state !== 'Lagos' && (
                  <div className="mt-5 rounded-xl border border-[#eaeaea] bg-[#fafafa] p-4">
                    {zoneName ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12.5px] font-medium text-black">
                            {zoneName}
                          </p>
                          <p className="font-numbers text-[13px] text-black">
                            {formatPrice(shipping)}
                          </p>
                        </div>
                        <p className="mt-1.5 text-[11px] text-black/50">
                          2–5 business days via courier.
                        </p>
                      </>
                    ) : (
                      <p className="text-[12px] font-medium text-red-600">
                        We don't deliver to {state} yet.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* ── 3 · PAYMENT ──────────────────────────── */}
              <section className="mt-8 mb-6">
                <SectionHeader number="3" title="Payment" />
                <div className="mt-4 space-y-2">
                  {paymentOptions.map((opt) => {
                    const active = payment === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          active
                            ? 'border-rose bg-rose/5'
                            : 'border-[#eaeaea] hover:border-rose/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={active}
                          onChange={() => setPayment(opt.id)}
                          className="mt-1 accent-rose"
                        />
                        <div>
                          <p className="text-[13px] font-medium text-black">
                            {opt.label}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-black/55">
                            {opt.sub}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              {orderError && (
                <p className="mb-2 rounded-xl bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
                  {orderError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!placedOrderId && items.length > 0 && (
          <div
            className="flex-shrink-0 border-t border-[#eaeaea] bg-white px-6 pt-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handlePayNow}
              disabled={!canSubmit || submitting}
              className={`flex w-full items-center justify-between rounded-full px-6 py-4 text-white transition-colors ${
                canSubmit && !submitting
                  ? 'bg-rose hover:bg-rose-deep'
                  : 'cursor-not-allowed bg-rose/30'
              }`}
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.18em]">
                {submitting ? 'Placing…' : 'Place order'}
              </span>
              <span className="font-numbers text-[15px]">
                {formatPrice(total)}
              </span>
            </button>
          </div>
        )}
      </div>

      {showFakePaystack && (
        <FakePaystack
          amount={total}
          email={email}
          onCancel={() => setShowFakePaystack(false)}
          onSuccess={() => {
            setShowFakePaystack(false);
            placeOrder('paystack');
          }}
        />
      )}
    </div>
  );
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose/10 text-[11px] font-bold text-rose">
        {number}
      </span>
      <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-black">
        {title}
      </h3>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/50">
          {label}
          {optional && (
            <span className="ml-1.5 font-medium normal-case tracking-normal text-black/30">
              (optional)
            </span>
          )}
        </label>
        {hint && !error && (
          <span className="text-[10.5px] text-black/40">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

function PlacedScreen({
  orderId,
  token,
  method,
  total,
  zoneName,
  bankName,
  bankAccountName,
  bankAccountNumber,
  copied,
  onCopyTracking,
  onSendWhatsApp,
  onClose,
}: {
  orderId: string;
  token: string | null;
  method: PaymentMethod;
  total: number;
  zoneName: string | null;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  copied: boolean;
  onCopyTracking: () => void;
  onSendWhatsApp: () => void;
  onClose: () => void;
}) {
  return (
    <div className="px-6 py-8">
      {/* CHECK ICON */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-7 w-7"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-black">
          Thank you.
        </h3>
        <p className="mt-2 text-[13px] leading-[1.6] text-black/55">
          Your order has been received.
        </p>
      </div>

      {/* ORDER ID */}
      <div className="mt-6 rounded-2xl border border-[#eaeaea] bg-rose/5 px-6 py-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose">
          Order ID
        </p>
        <p className="mt-2 font-numbers text-[26px] leading-none text-black">
          {orderId}
        </p>
      </div>

      {/* TRANSFER — STEPS + BANK DETAILS */}
      {method === 'transfer' && (
        <div className="mt-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-rose">
            Next step
          </p>

          {/* Step 1 */}
          <div className="mt-4 rounded-2xl border border-[#eaeaea] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">
                1
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-black">
                  Transfer{' '}
                  <span className="font-numbers text-rose">
                    {formatPrice(total)}
                  </span>{' '}
                  to:
                </p>
                <div className="mt-3 space-y-1.5 text-[12.5px] text-black">
                  <p>
                    <span className="text-black/50">Bank:</span> {bankName}
                  </p>
                  <p>
                    <span className="text-black/50">Account:</span>{' '}
                    <span className="font-numbers">{bankAccountNumber}</span>
                  </p>
                  <p>
                    <span className="text-black/50">Name:</span>{' '}
                    {bankAccountName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mt-2.5 rounded-2xl border border-[#eaeaea] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">
                2
              </span>
              <p className="flex-1 text-[13px] font-medium text-black">
                Screenshot the receipt.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mt-2.5 rounded-2xl border border-[#eaeaea] bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">
                3
              </span>
              <p className="flex-1 text-[13px] font-medium text-black">
                Tap below, attach the screenshot, and send.
              </p>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={onSendWhatsApp}
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-rose px-6 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-rose-deep"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
            </svg>
            Send receipt on WhatsApp
          </button>
          <p className="mt-2.5 text-center text-[11px] font-medium text-black/50">
            📎 Attach your receipt screenshot before sending.
          </p>

          <p className="mt-4 text-center text-[11px] text-black/45">
            We'll confirm once we receive your payment.
          </p>
        </div>
      )}

      {/* POD / PAYSTACK */}
      {method !== 'transfer' && (
        <div className="mt-7 rounded-2xl border border-[#eaeaea] bg-white p-5">
          <p className="text-[12.5px] text-black">
            {method === 'paystack'
              ? "Payment received. We'll WhatsApp you shortly to confirm."
              : "We'll WhatsApp you shortly to arrange delivery."}
          </p>
          <button
            onClick={onSendWhatsApp}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-rose px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-rose transition-colors hover:bg-rose hover:text-white"
          >
            Send us a message
          </button>
        </div>
      )}

      {/* TRACKING */}
      {token && (
        <div className="mt-6 rounded-2xl border border-[#eaeaea] bg-white p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-black/50">
            Track your order
          </p>
          <p className="mt-2 break-all text-[11.5px] text-black/60">
            {window.location.origin}/order/{token}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/order/${token}`}
              className="inline-flex items-center rounded-full bg-rose px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose-deep"
            >
              Track order
            </Link>
            <button
              onClick={onCopyTracking}
              className="inline-flex items-center rounded-full border border-[#eaeaea] px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:border-rose hover:text-rose"
            >
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        </div>
      )}

      {zoneName && (
        <p className="mt-5 text-center text-[11px] text-black/45">
          Delivery to {zoneName} · 2–5 business days
        </p>
      )}

      {/* FOOTER ACTIONS */}
      <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
        <Link
          to="/my-orders"
          className="inline-flex items-center justify-center rounded-full border border-[#eaeaea] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:border-rose hover:text-rose"
        >
          View all my orders
        </Link>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-rose"
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
}