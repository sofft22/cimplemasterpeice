import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts, deleteProduct, updateProduct } from '../../lib/products';
import { formatPrice } from '../../config';
import { CATEGORIES_WITH_ALL } from '../../config/categories';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';

interface Props {
  onCreate: () => void;
  onEdit: (p: Product) => void;
}

const LONG_PRESS_MS = 500;

type SortKey = 'manual' | 'newest' | 'name' | 'price';

export function AdminProducts({ onCreate, onEdit }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('manual');

  // Desktop drag
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Mobile long-press drag
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedOverId, setPickedOverId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== 'all') list = list.filter((p) => p.category_id === category);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category_id.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'manual':
        list.sort((a, b) => {
          const ao = (a as any).sort_order ?? 999999;
          const bo = (b as any).sort_order ?? 999999;
          if (ao !== bo) return ao - bo;
          return (
            new Date((b as any).created_at ?? 0).getTime() -
            new Date((a as any).created_at ?? 0).getTime()
          );
        });
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        break;
    }
    return list;
  }, [products, category, query, sort]);

  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  const handleSingleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await deleteProduct(p.id);
    await load();
  };

  // ---------- Reorder ----------
  const persistOrder = (orderedList: Product[]) => {
    orderedList.forEach((p, i) => {
      supabase
        .from('products')
        .update({ sort_order: i })
        .eq('id', p.id)
        .then(
          () => {},
          () => {}
        );
    });
  };

  const applyMove = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const list = [...filtered];
    const fromIdx = list.findIndex((p) => p.id === fromId);
    const toIdx = list.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const reordered = list.map((p, i) => ({ ...(p as any), sort_order: i })) as Product[];
    setProducts((prev) => {
      const rest = prev.filter((p) => !reordered.some((q) => q.id === p.id));
      return [...reordered, ...rest];
    });

    persistOrder(reordered);
  };

  // Desktop drag
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) setDragOverId(id);
  };
  const handleDragEnd = () => {
    const fromId = draggingId;
    const toId = dragOverId;
    setDraggingId(null);
    setDragOverId(null);
    if (fromId && toId) applyMove(fromId, toId);
  };

  // Mobile long-press drag
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartY.current = e.touches[0].clientY;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setPickedId(id);
      setPickedOverId(id);
      if (navigator.vibrate) navigator.vibrate(15);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current && !pickedId) {
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 5) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (!pickedId) return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    const rows = listRef.current?.querySelectorAll('[data-product-id]');
    if (!rows) return;
    let targetId: string | null = null;
    rows.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        targetId = (el as HTMLElement).dataset.productId ?? null;
      }
    });
    if (targetId && targetId !== pickedOverId) setPickedOverId(targetId);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pickedId && pickedOverId && pickedId !== pickedOverId) {
      applyMove(pickedId, pickedOverId);
    }
    setPickedId(null);
    setPickedOverId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose">
            Catalog
          </p>
          <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-black sm:text-[28px]">
            Products
          </h1>
          <p className="mt-2 text-[13px] text-black/55">
            {products.length} total
            {outOfStockCount > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-rose">
                  {outOfStockCount} out of stock
                </span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-rose-deep"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="mb-6 border-b border-[#eaeaea]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <nav className="no-scrollbar flex flex-1 items-center gap-x-5 overflow-x-auto sm:gap-x-7">
            {CATEGORIES_WITH_ALL.map((c) => {
              const active = category === c.id;
              const count =
                c.id === 'all'
                  ? products.length
                  : products.filter((p) => p.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`relative shrink-0 pb-3 text-[12.5px] font-semibold transition-colors ${
                    active ? 'text-black' : 'text-black/45 hover:text-black'
                  }`}
                >
                  {c.label}
                  <span
                    className={`ml-1.5 text-[11.5px] font-medium ${
                      active ? 'text-rose' : 'text-black/35'
                    }`}
                  >
                    {count}
                  </span>
                  {active && (
                    <span className="absolute -bottom-[13px] left-0 h-[2px] w-full bg-rose" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative w-full max-w-[220px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-[#eaeaea] bg-white py-2 pl-9 pr-3 text-[12.5px] text-black placeholder:text-black/40 focus:border-rose focus:outline-none"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-[#eaeaea] bg-white px-3 py-2 text-[12px] font-medium text-black focus:border-rose focus:outline-none"
            >
              <option value="manual">Custom order</option>
              <option value="newest">Newest</option>
              <option value="name">A–Z</option>
              <option value="price">Price high → low</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-[2.5px] border-rose/20 border-t-rose" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[13.5px] font-medium text-black/55">
            {products.length === 0
              ? 'No products yet. Add your first one.'
              : 'No products match.'}
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP */}
          <div className="hidden lg:block">
            <ul>
              {filtered.map((p) => {
                const isDragging = draggingId === p.id;
                const isDragOver = dragOverId === p.id;
                const variantCount = p.variants?.suggested?.length ?? 0;
                return (
                  <li
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragOver={(e) => handleDragOver(e, p.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => e.preventDefault()}
                    className={`group flex items-center gap-4 border-b border-[#f0f0f0] py-3.5 transition-colors last:border-0 hover:bg-[#fafafa] ${
                      isDragging ? 'opacity-40' : ''
                    } ${isDragOver ? 'border-t-2 border-t-rose' : ''}`}
                  >
                    {/* Drag handle */}
                    <span
                      className="cursor-grab pl-1 pr-1 text-black/20 group-hover:text-rose"
                      aria-label="Drag to reorder"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <circle cx="9" cy="6" r="1.4" />
                        <circle cx="15" cy="6" r="1.4" />
                        <circle cx="9" cy="12" r="1.4" />
                        <circle cx="15" cy="12" r="1.4" />
                        <circle cx="9" cy="18" r="1.4" />
                        <circle cx="15" cy="18" r="1.4" />
                      </svg>
                    </span>

                    {/* Image + name */}
                    <button
                      onClick={() => onEdit(p)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-[#fbeef1]">
                        {p.image_url && (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-black">
                          {p.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-black/50">
                          <span className="capitalize">{p.category_id}</span>
                          {variantCount > 0 && ` · ${variantCount} variant${variantCount === 1 ? '' : 's'}`}
                          {p.badge && ` · ${p.badge}`}
                        </p>
                      </div>
                    </button>

                    {/* Price */}
                    <div className="w-[100px] flex-shrink-0 text-right">
                      <p className="text-[13.5px] font-semibold text-black">
                        {formatPrice(p.price)}
                      </p>
                    </div>

                    {/* Stock */}
                    <div className="w-[100px] flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.in_stock ? 'bg-green-500' : 'bg-rose'
                          }`}
                        />
                        <span
                          className={
                            p.in_stock ? 'text-green-700' : 'text-rose'
                          }
                        >
                          {p.in_stock ? 'In stock' : 'Sold out'}
                        </span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-shrink-0 items-center gap-4 pr-1">
                      <button
                        onClick={() => onEdit(p)}
                        className="text-[11.5px] font-semibold text-black/60 transition-colors hover:text-rose"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSingleDelete(p)}
                        className="text-[11.5px] font-medium text-black/30 transition-colors hover:text-red-600"
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* MOBILE */}
          <div ref={listRef} className="lg:hidden">
            {filtered.map((p) => {
              const isPicked = pickedId === p.id;
              const isPickedOver = pickedOverId === p.id && pickedId && pickedId !== p.id;
              return (
                <div
                  key={p.id}
                  data-product-id={p.id}
                  onTouchStart={(e) => handleTouchStart(e, p.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`flex items-center gap-3 border-b border-[#f0f0f0] py-3.5 last:border-0 ${
                    isPicked ? 'bg-rose/10 shadow-[0_10px_30px_-10px_rgba(168,76,105,0.4)]' : ''
                  } ${isPickedOver ? 'border-t-2 border-t-rose' : ''}`}
                  style={{ touchAction: isPicked ? 'none' : 'pan-y' }}
                >
                  <button
                    onClick={() => !isPicked && onEdit(p)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-[#fbeef1]">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-black">
                        {p.name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-black/50 capitalize">
                        {p.category_id}
                        {p.in_stock === false && ' · Sold out'}
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <p className="text-[13.5px] font-semibold text-black">
                      {formatPrice(p.price)}
                    </p>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="h-3.5 w-3.5 text-black/25"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                </div>
              );
            })}
            <p className="mt-4 text-center text-[10.5px] font-medium uppercase tracking-[0.14em] text-black/40">
              Long-press to reorder
            </p>
          </div>
        </>
      )}
    </div>
  );
}