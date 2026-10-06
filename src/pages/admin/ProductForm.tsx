import { useState, useEffect } from 'react';
import {
  uploadProductImage,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../lib/products';
import { CATEGORIES } from '../../config/categories';
import type { Product } from '../../types';

interface Props {
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

const BADGES = ['Bestseller', 'New', 'Limited'];

interface Variant {
  label: string;
  priceDelta: number;
}

export function AdminProductForm({ product, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [categoryId, setCategoryId] = useState('wigs');
  const [badge, setBadge] = useState('');
  const [inStock, setInStock] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? '');
    setPrice(String(product.price));
    setCompareAtPrice(product.compare_at_price ? String(product.compare_at_price) : '');
    setCategoryId(product.category_id);
    setBadge(product.badge ?? '');
    setInStock(product.in_stock);
    setImageUrl(product.image_url ?? '');
    setImageUrls(product.image_urls ?? []);
    setVariants(product.variants?.suggested ?? []);
  }, [product]);

  const allImages = [imageUrl, ...imageUrls].filter(Boolean);

  const setImages = (list: string[]) => {
    setImageUrl(list[0] ?? '');
    setImageUrls(list.slice(1));
  };

  const handleImageUpload = async (file: File) => {
    if (allImages.length >= 3) {
      setError('Max 3 images per product');
      return;
    }
    setUploading(true);
    const { url, error } = await uploadProductImage(file);
    setUploading(false);
    if (error || !url) {
      setError(error ?? 'Upload failed');
      return;
    }
    setImages([...allImages, url]);
  };

  const removeImage = (index: number) => {
    const next = allImages.filter((_, i) => i !== index);
    setImages(next);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const next = [...allImages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };

  const addVariant = () => setVariants((prev) => [...prev, { label: '', priceDelta: 0 }]);
  const updateVariant = (i: number, patch: Partial<Variant>) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const removeVariant = (i: number) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (!price || Number(price) <= 0) return setError('Valid price is required');
    if (!imageUrl) return setError('Main image is required');

    setSaving(true);
    const payload: Partial<Product> = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      category_id: categoryId,
      badge: badge || null,
      in_stock: inStock,
      image_url: imageUrl,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      variants: variants.length > 0 ? { suggested: variants } : undefined,
    };

    const result = product
      ? await updateProduct(product.id, payload)
      : await createProduct(payload);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"?`)) return;
    const { error } = await deleteProduct(product.id);
    if (error) {
      setError(error);
      return;
    }
    onSaved();
  };

  const canAddMore = allImages.length < 3;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      {/* BACK */}
      <button
        onClick={onCancel}
        className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-black/50 transition-colors hover:text-rose"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3.5 w-3.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to products
      </button>

      {/* HEADER */}
      <div className="border-b border-[#eaeaea] pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose">
          {product ? 'Edit' : 'New'}
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
          {product ? 'Edit product' : 'New product'}
        </h1>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        {/* LEFT COLUMN — Basics + Description */}
        <div className="space-y-6">
          <section className="border-b border-[#eaeaea] pb-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Basics
            </p>

            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Body Wave Lace Wig"
                className="input"
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short, evocative description."
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₦)">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="185000"
                  className="input"
                />
              </Field>
              <Field label="Compare at (₦)">
                <input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="220000"
                  className="input"
                />
              </Field>
            </div>
          </section>

          {/* VARIANTS */}
          <section className="border-b border-[#eaeaea] pb-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
                Variants
              </p>
              <button
                onClick={addVariant}
                className="text-[11.5px] font-semibold text-rose hover:text-rose-deep"
              >
                + Add
              </button>
            </div>
            <p className="mt-1.5 text-[12px] text-black/50">
              Optional. Sizes, shades, or pack options.
            </p>

            {variants.length === 0 ? (
              <p className="mt-4 text-[12.5px] text-black/40">
                No variants — single price.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <input
                      className="input flex-1"
                      value={v.label}
                      onChange={(e) => updateVariant(i, { label: e.target.value })}
                      placeholder="Label (e.g. 18 inch)"
                    />
                    <input
                      type="number"
                      className="input w-[110px]"
                      value={v.priceDelta}
                      onChange={(e) => updateVariant(i, { priceDelta: Number(e.target.value) })}
                      placeholder="+ ₦"
                    />
                    <button
                      onClick={() => removeVariant(i)}
                      className="mt-2.5 text-black/30 hover:text-red-600"
                      aria-label="Remove variant"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* IMAGES */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
                Images
              </p>
              <p className="text-[11.5px] text-black/45">{allImages.length} / 3</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {allImages.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-[#eaeaea] bg-[#fbeef1]"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[12px] font-bold text-black shadow-sm transition-colors hover:text-rose"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/85 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">
                      Main
                    </span>
                  )}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {i > 0 && (
                        <button
                          onClick={() => moveImage(i, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-black shadow-sm hover:text-rose"
                          aria-label="Move left"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                      )}
                      {i < allImages.length - 1 && (
                        <button
                          onClick={() => moveImage(i, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-black shadow-sm hover:text-rose"
                          aria-label="Move right"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {canAddMore && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#eaeaea] bg-white text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/50 transition-colors hover:border-rose hover:text-rose">
                  {uploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-[2px] border-rose/20 border-t-rose" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — Categorization + Stock */}
        <div className="space-y-6">
          <section className="border-b border-[#eaeaea] pb-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Categorization
            </p>

            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Badge">
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="input"
              >
                <option value="">None</option>
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          <section className="border-b border-[#eaeaea] pb-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">
              Stock
            </p>
            <button
              onClick={() => setInStock((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#eaeaea] bg-white px-4 py-3 text-left transition-colors hover:border-rose"
            >
              <div>
                <p className="text-[13.5px] font-medium text-black">
                  {inStock ? 'In stock' : 'Out of stock'}
                </p>
                <p className="mt-0.5 text-[12px] text-black/50">
                  {inStock ? 'Available for purchase' : 'Hidden from sale'}
                </p>
              </div>
              <span
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  inStock ? 'bg-rose' : 'bg-[#eaeaea]'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    inStock ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </section>

          {/* ERROR */}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {error}
            </p>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse sm:items-center">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full rounded-full bg-rose px-8 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-rose-deep disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>

            {product && (
              <button
                onClick={handleDelete}
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-red-600 transition-colors hover:text-red-800"
              >
                Delete product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-black/50">
        {label}
      </span>
      {children}
    </label>
  );
}