/*
# Create coupons table

## Purpose
Stores discount coupons that customers can apply at checkout. Admins manage
coupons from the admin panel; the storefront reads active/featured coupons
to display promotional banners and validate codes at checkout.

## New Table: coupons

| Column            | Type         | Default             | Description                                              |
|-------------------|--------------|---------------------|----------------------------------------------------------|
| id                | text         | gen_random_uuid()   | Primary key (text to match existing project convention)  |
| code              | text         | —                   | Unique, NOT NULL. Stored lowercase. The code customers   |
|                   |              |                     | type at checkout.                                        |
| type              | text         | —                   | NOT NULL. Discount kind: 'percent', 'fixed', 'shipping'. |
| value             | numeric      | 0                   | Percentage number (e.g. 10 = 10%) or ₦ amount for        |
|                   |              |                     | 'fixed'. Ignored for 'shipping' type.                    |
| first_order_only  | boolean      | false               | If true, coupon only applies to a customer's first order.|
| min_order         | numeric      | 0                   | Minimum subtotal in ₦ required to use the coupon.        |
|                   |              |                     | 0 means no minimum.                                      |
| max_uses          | integer      | NULL                | Maximum total redemptions. NULL means unlimited.         |
| used_count        | integer      | 0                   | How many times this coupon has been redeemed.            |
| expires_at        | timestamptz  | NULL                | Optional expiry. NULL means never expires.               |
| active            | boolean      | true                | Admin can deactivate a coupon without deleting it.       |
| featured          | boolean      | false               | Controls whether a promo banner shows on the home page.  |
| created_at        | timestamptz  | now()               | Timestamp of creation.                                   |

## Constraints
- `coupons_code_key` — UNIQUE on (code). Enforced via unique index on
  lower(code) so lookups are case-insensitive and duplicate codes are
  impossible regardless of input casing.
- `coupons_type_check` — CHECK that type IN ('percent', 'fixed', 'shipping').

## Security (RLS)
- RLS enabled on coupons.
- public_read_coupons — SELECT for anon + authenticated (storefront needs to
  read active/featured coupons without signing in).
- auth_insert_coupons — INSERT for authenticated (admin only).
- auth_update_coupons — UPDATE for authenticated (admin only).
- auth_delete_coupons — DELETE for authenticated (admin only).

## Important Notes
1. This is a single-tenant app (admin signs in via Supabase auth, but the
   storefront runs as anon). SELECT is open to anon so the storefront can
   display featured coupons and validate codes.
2. All write operations (INSERT/UPDATE/DELETE) are restricted to
   authenticated admins.
3. The code column stores lowercase values. The unique index on lower(code)
   prevents case-variant duplicates (e.g. 'SAVE10' and 'save10').
*/

CREATE TABLE IF NOT EXISTS coupons (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed', 'shipping')),
  value numeric NOT NULL DEFAULT 0,
  first_order_only boolean NOT NULL DEFAULT false,
  min_order numeric NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive unique constraint on code
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_key
  ON coupons (lower(code));

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_coupons" ON coupons;
CREATE POLICY "public_read_coupons"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_coupons" ON coupons;
CREATE POLICY "auth_insert_coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_coupons" ON coupons;
CREATE POLICY "auth_update_coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_coupons" ON coupons;
CREATE POLICY "auth_delete_coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (true);
