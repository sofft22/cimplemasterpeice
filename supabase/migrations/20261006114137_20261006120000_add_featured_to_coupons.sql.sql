/*
# Add featured column to coupons

## Purpose
Adds a boolean column to control whether a coupon's promo banner appears on
the home page. The original coupons migration may or may not have included
this column — IF NOT EXISTS makes this safe either way.

## Changes
- New column: `featured` (boolean, NOT NULL, default false) on `coupons`.

## Important Notes
1. Additive only — no existing column or data is modified.
2. Uses ADD COLUMN IF NOT EXISTS — safe to re-run.
*/

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
