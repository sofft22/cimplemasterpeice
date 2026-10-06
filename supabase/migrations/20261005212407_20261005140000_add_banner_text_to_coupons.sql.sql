/*
# Add banner_text column to coupons

## Purpose
Adds an optional text column to store custom promotional banner copy for a
coupon. When non-null, the storefront can display this text in the promo
banner instead of generating one from the coupon code/type.

## Changes
- New column: `banner_text` (text, nullable) on the `coupons` table.

## Important Notes
1. No other columns are modified.
2. Nullable — existing rows and new inserts work without providing a value.
3. No RLS or policy changes needed; the existing policies already cover the
   new column.
*/

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS banner_text text;
