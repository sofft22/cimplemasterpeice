import { supabase } from './supabase';
import type { Product } from '../types';

const TABLE = 'products';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[products] fetch error:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function createProduct(product: Partial<Product>): Promise<{ error: string | null }> {
  const row = toRow(product);
  const { error } = await supabase.from(TABLE).insert(row);
  return { error: error?.message ?? null };
}

export async function updateProduct(
  id: string,
  product: Partial<Product>
): Promise<{ error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: 'Your session has expired. Please sign in again.' };
  }
  const row = toRow(product);
  const { error } = await supabase.from(TABLE).update(row).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function uploadProductImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file);
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}

// ---- mappers between DB row and frontend Product type ----

function mapRow(row: any): Product {
  return {
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
    variants: row.variants
      ? { suggested: row.variants }
      : undefined,
  };
}

function toRow(product: Partial<Product>) {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    compare_at_price: product.compare_at_price ?? null,
    image_url: product.image_url,
    image_urls: product.image_urls ?? null,
    in_stock: product.in_stock ?? true,
    category_id: product.category_id,
    badge: product.badge ?? null,
    cart_adds: product.cart_adds ?? 0,
    variants: product.variants?.suggested ?? null,
  };
}