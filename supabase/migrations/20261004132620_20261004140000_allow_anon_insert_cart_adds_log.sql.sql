/*
# Allow anonymous users to INSERT into cart_adds_log

## Purpose
Storefront customers add items to the cart while not logged in (anonymous).
The previous INSERT policy only allowed authenticated (admin) users to insert,
which blocked the storefront from logging cart-add events. This migration
opens INSERT to the anon role as well.

## 1. Policy Changes

### cart_adds_log
- INSERT policy replaced: now allows `anon, authenticated` with `WITH CHECK (true)`.
- SELECT policy: unchanged — already public (anon + authenticated).
- UPDATE policy: unchanged — authenticated only (admin maintenance).
- DELETE policy: unchanged — authenticated only (admin maintenance).

## 2. Important Notes
1. Only the INSERT policy changes. Reads stay public, and updates/deletes
   remain restricted to authenticated admins.
2. The policy is dropped before recreation to keep the migration idempotent.
*/

DROP POLICY IF EXISTS "auth_insert_cart_adds_log" ON cart_adds_log;

CREATE POLICY "public_insert_cart_adds_log"
  ON cart_adds_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
