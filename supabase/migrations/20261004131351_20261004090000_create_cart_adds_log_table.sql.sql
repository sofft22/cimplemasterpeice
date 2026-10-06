/*
# Create cart_adds_log table

## Purpose
Tracks every time a product is added to the shopping cart, creating a log
record that can be analyzed later to understand which products are most
popular and when cart activity happens.

## 1. New Tables

### cart_adds_log
A simple append-only log of cart-add events.
- id: UUID primary key, auto-generated via gen_random_uuid()
- product_id: UUID, references products(id). If a product is deleted,
  the log row is also deleted (ON DELETE CASCADE) so the log never
  dangles orphaned references.
- created_at: timestamptz, defaults to now() so each insert is
  automatically timestamped.

## 2. Indexes
- idx_cart_adds_log_product_id on product_id — speeds up lookups that
  group or filter cart activity by product.
- idx_cart_adds_log_created_at on created_at — speeds up time-based
  queries (e.g. "cart adds in the last 7 days", sorted dashboards).

## 3. Security (RLS)
- Row Level Security is ENABLED on cart_adds_log.
- SELECT: public (anon + authenticated) can read the log. This matches
  the existing store pattern where product data is public.
- INSERT / UPDATE / DELETE: only authenticated (admin) users can modify
  the log. This matches the existing products/services policy pattern.

## 4. Important Notes
1. The table is append-only by design; UPDATE and DELETE policies exist
   for admin maintenance but normal app usage only inserts.
2. ON DELETE CASCADE on the product_id foreign key keeps the log clean
   if a product is ever removed.
3. Indexes are created with IF NOT EXISTS so the migration is safe to
   re-run if a prior attempt timed out after committing.
*/

CREATE TABLE IF NOT EXISTS cart_adds_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cart_adds_log ENABLE ROW LEVEL SECURITY;

-- Public can read cart-add logs (matches store's public-read pattern)
DROP POLICY IF EXISTS "public_read_cart_adds_log" ON cart_adds_log;
CREATE POLICY "public_read_cart_adds_log"
  ON cart_adds_log FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated (admin) users can insert log entries
DROP POLICY IF EXISTS "auth_insert_cart_adds_log" ON cart_adds_log;
CREATE POLICY "auth_insert_cart_adds_log"
  ON cart_adds_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated (admin) users can update log entries
DROP POLICY IF EXISTS "auth_update_cart_adds_log" ON cart_adds_log;
CREATE POLICY "auth_update_cart_adds_log"
  ON cart_adds_log FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- Only authenticated (admin) users can delete log entries
DROP POLICY IF EXISTS "auth_delete_cart_adds_log" ON cart_adds_log;
CREATE POLICY "auth_delete_cart_adds_log"
  ON cart_adds_log FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_cart_adds_log_product_id
  ON cart_adds_log(product_id);

CREATE INDEX IF NOT EXISTS idx_cart_adds_log_created_at
  ON cart_adds_log(created_at);
