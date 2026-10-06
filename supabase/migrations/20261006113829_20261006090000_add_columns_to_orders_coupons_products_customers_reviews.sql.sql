/*
# Add new columns to orders, coupons, products, customers, reviews

## Purpose
Purely additive schema changes — adds new nullable/defaulted columns to five
existing tables. No existing column is modified, renamed, or deleted. No
existing data is touched.

## Changes by table

### orders
- coupon_code (text, nullable) — the discount code applied to the order, if any.
- discount_amount (numeric, nullable) — the naira amount discounted, if any.

### coupons
- uses (integer, default 0) — how many times the coupon has been used.
- active (boolean, default true) — whether the coupon is currently active.
- usage_limit (integer, nullable) — max total uses; null means unlimited.

### products
- stock_count (integer, nullable) — current stock level; null means untracked.

### customers
- tags (text[], nullable) — array of free-form tags for segmentation.

### reviews
- order_id (text, nullable) — links a review to the order it was placed from.

## Important Notes
1. Every statement uses ADD COLUMN IF NOT EXISTS — safe to re-run.
2. No existing column or data is modified or deleted.
3. No RLS or policy changes — existing policies cover new nullable columns.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric;

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS uses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS usage_limit integer;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_count integer;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS tags text[];

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS order_id text;
