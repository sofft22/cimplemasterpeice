import { supabase } from './supabase';
import { BRAND, BANK } from '../config';
import type { Product, Service } from '../types';

// ============================================
// PHONE
// ============================================

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits;
  }
  if (digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

export function isValidNigerianPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  return /^0[789]\d{9}$/.test(normalized);
}

// ============================================
// SETTINGS
// ============================================

export interface ShippingZone {
  id: string;
  name: string;
  price: number;
  states: string[];
}

export interface StoreSettings {
  whatsapp_number: string;
  email: string;
  instagram: string;
  tiktok: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  payment_paystack_enabled: boolean;
  payment_transfer_enabled: boolean;
  payment_delivery_enabled: boolean;
  store_open: boolean;
  closed_message: string;
  lagos_axes: { id: string; label: string; price: number }[];
  shipping_zones: ShippingZone[];
}

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsapp_number: BRAND.whatsappNumber,
  email: BRAND.email,
  instagram: BRAND.instagram,
  tiktok: BRAND.tiktok,
  bank_name: BANK.name,
  bank_account_name: BANK.accountName,
  bank_account_number: BANK.accountNumber,
  payment_paystack_enabled: true,
  payment_transfer_enabled: true,
  payment_delivery_enabled: true,
  store_open: true,
  closed_message: 'We’re closed for now. Back soon.',
  lagos_axes: [
    { id: 'axis-1', label: 'Axis 1: Lekki phase 1, Freedom Way, Itedo, Ikate, Ikoyi', price: 2000 },
    { id: 'axis-2', label: 'Axis 2: Lagos island, Victoria Island, Surulere, Mushin, Shomolu, Eti osa 1', price: 4000 },
    { id: 'axis-3', label: 'Axis 3: Agege, Ifako-ijaiye, Amuwo Odofin, Ikeja, Kosofe, Apapa, Lagos Mainland, Eti Osa 2', price: 8000 },
    { id: 'axis-4', label: 'Axis 4: Ojo, Epe, Ibeju, Ikorodu, Alimosho, Ajeromi, Eti Osa 3', price: 12000 },
  ],
  shipping_zones: [
    {
      id: 'zone-1',
      name: 'Near Lagos',
      price: 4000,
      states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Kogi'],
    },
    {
      id: 'zone-2',
      name: 'Mid Nigeria',
      price: 6500,
      states: [
        'Edo', 'Delta', 'Anambra', 'Enugu', 'Ebonyi', 'Imo', 'Abia',
        'Rivers', 'Bayelsa', 'Akwa Ibom', 'Cross River',
        'Benue', 'FCT', 'Nasarawa', 'Niger', 'Plateau',
      ],
    },
    {
      id: 'zone-3',
      name: 'Far Nigeria',
      price: 9500,
      states: [
        'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara',
        'Jigawa', 'Bauchi', 'Gombe', 'Yobe', 'Borno',
        'Adamawa', 'Taraba',
      ],
    },
  ],
};

export async function fetchSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'settings')
      .maybeSingle();
    if (error || !data?.value) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(data.value as Partial<StoreSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function zoneForState(
  state: string,
  zones: ShippingZone[]
): ShippingZone | null {
  if (!state) return null;
  return zones.find((z) => z.states.includes(state)) ?? null;
}

// ============================================
// COUPONS
// ============================================

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: number;
  min_order: number;
  first_order_only: boolean;
  expires_at: string | null;
  banner_text: string | null;
  active: boolean;
  featured: boolean;
  usage_limit: number | null;
  uses: number;
  created_at: string;
}

export interface CouponInput {
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: number;
  min_order: number;
  first_order_only: boolean;
  expires_at: string | null;
  banner_text: string | null;
  active: boolean;
  featured: boolean;
  usage_limit: number | null;
}

function mapCouponRow(c: any): Coupon {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    min_order: c.min_order ?? 0,
    first_order_only: c.first_order_only ?? false,
    expires_at: c.expires_at ?? null,
    banner_text: c.banner_text ?? null,
    active: c.active ?? true,
    featured: c.featured ?? false,
    usage_limit: c.usage_limit ?? null,
    uses: c.uses ?? 0,
    created_at: c.created_at,
  };
}

/** Admin — fetch every coupon. */
export async function fetchAllCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapCouponRow);
  } catch {
    return [];
  }
}

/** Admin — create a coupon. */
export async function createCoupon(
  input: CouponInput
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('coupons').insert({
      code: input.code.trim().toLowerCase(),
      type: input.type,
      value: input.value,
      min_order: input.min_order,
      first_order_only: input.first_order_only,
      expires_at: input.expires_at,
      banner_text: input.banner_text,
      active: input.active,
      featured: input.featured,
      usage_limit: input.usage_limit,
      uses: 0,
    });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to create coupon' };
  }
}

/** Admin — update specific fields on a coupon. */
export async function updateCoupon(
  id: string,
  patch: Partial<CouponInput>
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('coupons')
      .update(patch)
      .eq('id', id);
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to update coupon' };
  }
}

/** Admin — delete a coupon. */
export async function deleteCoupon(
  id: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to delete coupon' };
  }
}

/** Customer checkout — validate a coupon before applying. */
export async function validateCoupon(
  code: string,
  subtotal: number,
  phone: string
): Promise<{ coupon: Coupon | null; error: string | null }> {
  try {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return { coupon: null, error: 'Enter a code' };

    const { data, error: fetchErr } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', trimmed)
      .maybeSingle();

    if (fetchErr) return { coupon: null, error: fetchErr.message };
    if (!data) return { coupon: null, error: 'Invalid code' };

    const coupon = mapCouponRow(data);

    // Active?
    if (!coupon.active) {
      return { coupon: null, error: 'This code is no longer available' };
    }

    // Expired?
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return { coupon: null, error: 'This code has expired' };
    }

    // Global usage limit reached?
    if (coupon.usage_limit !== null && coupon.uses >= coupon.usage_limit) {
      return { coupon: null, error: 'This code has reached its limit' };
    }

    // Minimum order?
    if (coupon.min_order && subtotal < coupon.min_order) {
      return {
        coupon: null,
        error: `Minimum order ₦${coupon.min_order.toLocaleString('en-NG')}`,
      };
    }

    // First-order-only?
    if (coupon.first_order_only) {
      const { data: priorOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_phone', phone)
        .limit(1);
      if (priorOrders && priorOrders.length > 0) {
        return {
          coupon: null,
          error: 'This code is for first-time customers only',
        };
      }
    }

    // Already used by this phone?
    const { data: priorUse } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_phone', phone)
      .eq('coupon_code', coupon.code)
      .limit(1);
    if (priorUse && priorUse.length > 0) {
      return { coupon: null, error: 'You have already used this code' };
    }

    return { coupon, error: null };
  } catch (e: any) {
    return { coupon: null, error: e?.message ?? 'Failed to check code' };
  }
}

/** Given a coupon + cart subtotal + shipping, compute discount + new shipping. */
export function calculateDiscount(
  coupon: Coupon,
  subtotal: number,
  shipping: number
): { discount: number; shippingAfter: number } {
  if (coupon.type === 'percent') {
    return {
      discount: Math.round((subtotal * coupon.value) / 100),
      shippingAfter: shipping,
    };
  }
  if (coupon.type === 'fixed') {
    return {
      discount: Math.min(coupon.value, subtotal),
      shippingAfter: shipping,
    };
  }
  if (coupon.type === 'shipping') {
    return { discount: 0, shippingAfter: 0 };
  }
  return { discount: 0, shippingAfter: shipping };
}

/** Called after a successful order to bump the coupon's usage counter. */
export async function incrementCouponUse(couponId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('coupons')
      .select('uses')
      .eq('id', couponId)
      .maybeSingle();
    const current = data?.uses ?? 0;
    await supabase
      .from('coupons')
      .update({ uses: current + 1 })
      .eq('id', couponId);
  } catch {
    // silently ignore — non-critical
  }
}

/** Storefront — fetch the featured coupon for the promo banner. */
export async function fetchFeaturedCoupon(): Promise<Coupon | null> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const coupon = mapCouponRow(data);

    // Sanity: skip if it's already expired
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return null;
    }
    return coupon;
  } catch {
    return null;
  }
}

// ============================================
// PRODUCTS
// ============================================

let productsCache: Product[] | null = null;
let productsCacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;
const LS_KEY = 'cimmple_products_cache_v1';

if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data)) {
        productsCache = parsed.data;
        productsCacheTime = parsed.time ?? 0;
      }
    }
  } catch {
    // ignore
  }
}

export async function fetchPublicProducts(): Promise<Product[]> {
  if (productsCache && Date.now() - productsCacheTime < CACHE_MS) {
    return productsCache;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data) return productsCache ?? [];

    const mapped = data.map((row: any): Product => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      price: row.price,
      compare_at_price: row.compare_at_price,
      image_url: row.image_url ?? '',
      image_urls: row.image_urls ?? undefined,
      in_stock: row.in_stock ?? true,
      category_id: row.category_id,
      badge: row.badge,
      cart_adds: row.cart_adds ?? 0,
      sort_order: row.sort_order ?? null,
      variants: row.variants ? { suggested: row.variants } : undefined,
    }));

    productsCache = mapped;
    productsCacheTime = Date.now();

    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ data: mapped, time: productsCacheTime })
      );
    } catch {
      // ignore
    }

    return mapped;
  } catch {
    return productsCache ?? [];
  }
}

// ============================================
// TRENDING
// ============================================

let trendingCache: string[] | null = null;
let trendingCacheTime = 0;
const TRENDING_CACHE_MS = 10 * 60 * 1000;
const TRENDING_LS_KEY = 'cimmple_trending_cache_v1';

if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(TRENDING_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data)) {
        trendingCache = parsed.data;
        trendingCacheTime = parsed.time ?? 0;
      }
    }
  } catch {
    // ignore
  }
}

export async function fetchTrendingIds(): Promise<string[]> {
  if (trendingCache && Date.now() - trendingCacheTime < TRENDING_CACHE_MS) {
    return trendingCache;
  }

  const tryRange = async (days: number | null): Promise<string[]> => {
    let query = supabase.from('cart_adds_log').select('product_id');
    if (days !== null) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', cutoff);
    }
    const { data } = await query;
    if (!data || data.length === 0) return [];
    const counts: Record<string, number> = {};
    data.forEach((row: any) => {
      if (!row.product_id) return;
      counts[row.product_id] = (counts[row.product_id] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);
  };

  let ids = await tryRange(14);
  if (ids.length < 20) ids = await tryRange(null);

  const trimmed = ids.slice(0, 20);
  trendingCache = trimmed;
  trendingCacheTime = Date.now();

  try {
    localStorage.setItem(
      TRENDING_LS_KEY,
      JSON.stringify({ data: trimmed, time: trendingCacheTime })
    );
  } catch {
    // ignore
  }

  return trimmed;
}

// ============================================
// SERVICES
// ============================================

export async function fetchPublicServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any): Service => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      duration: row.duration ?? '',
      price: row.price ?? 0,
      image_url: row.image_url ?? '',
      image_urls: row.image_urls ?? undefined,
      in_stock: row.in_stock ?? true,
    }));
  } catch {
    return [];
  }
}

// ============================================
// REVIEWS
// ============================================

export interface StoreReview {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export async function fetchApprovedReviews(productId: string): Promise<StoreReview[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, customer_name, rating, comment, created_at')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as StoreReview[];
  } catch {
    return [];
  }
}

export interface TopReview {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  product_name: string;
}

export async function fetchTopApprovedReviews(limit = 3): Promise<TopReview[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, customer_name, rating, comment, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    const productIds = Array.from(
      new Set(data.map((r: any) => r.product_id))
    ).filter(Boolean);

    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    const nameById: Record<string, string> = {};
    (products ?? []).forEach((p: any) => {
      nameById[p.id] = p.name;
    });

    return data.map((r: any): TopReview => ({
      id: r.id,
      product_id: r.product_id,
      customer_name: r.customer_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      product_name: nameById[r.product_id] ?? 'Product',
    }));
  } catch {
    return [];
  }
}

export async function submitReview(review: {
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('reviews').insert({
      ...review,
      approved: false,
    });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to submit review' };
  }
}

// ============================================
// ORDERS
// ============================================

export interface OrderPayload {
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
  items: any[];
  subtotal: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  coupon_code?: string | null;
  discount_amount?: number | null;
}

export async function createOrder(
  order: OrderPayload
): Promise<{ error: string | null; tracking_token: string | null }> {
  try {
    const { data: inserted, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select('tracking_token')
      .maybeSingle();

    if (orderError) return { error: orderError.message, tracking_token: null };

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', order.customer_phone)
      .maybeSingle();

    if (!existing) {
      await supabase.from('customers').insert({
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        total_orders: 0,
        total_spent: 0,
      });
    }

    return {
      error: null,
      tracking_token: inserted?.tracking_token ?? null,
    };
  } catch (e: any) {
    return {
      error: e?.message ?? 'Failed to create order',
      tracking_token: null,
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<{ error: string | null }> {
  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, total, customer_phone')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) return { error: fetchErr?.message ?? 'Order not found' };

    const wasDelivered = order.status === 'delivered';
    const willBeDelivered = newStatus === 'delivered';

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateErr) return { error: updateErr.message };

    if (wasDelivered !== willBeDelivered) {
      const delta = willBeDelivered ? 1 : -1;
      const { data: cust } = await supabase
        .from('customers')
        .select('id, total_orders, total_spent')
        .eq('phone', order.customer_phone)
        .maybeSingle();

      if (cust) {
        await supabase
          .from('customers')
          .update({
            total_orders: Math.max(0, (cust.total_orders ?? 0) + delta),
            total_spent: Math.max(0, (cust.total_spent ?? 0) + delta * order.total),
          })
          .eq('id', cust.id);
      }
    }

    return { error: null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to update status' };
  }
}

// ============================================
// ORDER TRACKING
// ============================================

export interface TrackedOrder {
  order_id: string;
  tracking_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  apartment: string | null;
  city: string;
  state: string;
  shipping_axis: string | null;
  shipping_price: number;
  items: any[];
  subtotal: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export async function fetchOrderByToken(
  token: string
): Promise<TrackedOrder | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_token', token)
      .maybeSingle();
    if (error || !data) return null;
    return data as TrackedOrder;
  } catch {
    return null;
  }
}