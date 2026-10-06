/*
# Add sort_order column to products table

## Purpose
Enables manual product ordering on the shop page. Admins can assign a
sort_order integer to each product — lower values appear first. Products
with a null sort_order fall back to created_at descending ordering.

## 1. Column Changes

### products
- New column: sort_order (integer, nullable, default null)
  - NULL means "no manual ordering" — these products sort after any
    product that has an explicit sort_order, ordered by created_at desc.
  - Lower sort_order values appear first when sorting.

## 2. Index
- idx_products_sort_order on products(sort_order) — speeds up the
  ORDER BY sort_order clause used on the shop page.

## 3. Security
- No policy changes. The column inherits existing RLS behavior:
  public (anon + authenticated) can SELECT it, authenticated (admin)
  can INSERT/UPDATE/DELETE it.

## 4. Important Notes
1. The column is added with IF NOT EXISTS so the migration is safe to
   re-run if a prior attempt timed out after committing.
2. No existing data is modified — all current products get NULL for
   sort_order, which preserves the current created_at desc ordering.
3. The index is created with IF NOT EXISTS for idempotency.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sort_order
  ON products(sort_order);
