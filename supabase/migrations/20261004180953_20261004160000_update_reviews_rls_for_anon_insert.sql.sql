/*
# Update reviews RLS policies for anonymous review submission

## Purpose
Storefront customers (anonymous, not logged in) need to submit product reviews.
Reviews always land as unapproved (approved = false) and are moderated by
authenticated admins. This migration opens INSERT to the anon role while
enforcing that anonymous inserts can never be auto-approved.

## 1. Policy Changes on reviews

### INSERT — replaced
- Old: `auth_insert_reviews` — only authenticated could insert.
- New: `public_insert_reviews` — anon AND authenticated can insert, but
  WITH CHECK (approved = false) guarantees no row can be inserted with
  approved = true. This prevents anyone from bypassing moderation.

### SELECT — updated
- `public_read_approved_reviews` — changed from `TO anon` to
  `TO anon, authenticated` so both roles can read approved reviews.
- `auth_read_reviews` — unchanged (authenticated can SELECT all rows,
  including unapproved, for moderation).

### UPDATE — unchanged
- `auth_update_reviews` — authenticated only, USING (true) WITH CHECK (true).

### DELETE — unchanged
- `auth_delete_reviews` — authenticated only, USING (true).

## 2. Important Notes
1. The WITH CHECK (approved = false) on INSERT is the enforcement point —
   even if a malicious client sends approved = true, the insert is rejected.
2. Authenticated admins retain full read/update/delete access for moderation.
3. Policies are dropped before recreation to keep the migration idempotent.
*/

-- INSERT: allow anon + authenticated, force approved = false
DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
DROP POLICY IF EXISTS "public_insert_reviews" ON reviews;
CREATE POLICY "public_insert_reviews"
  ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (approved = false);

-- SELECT (approved): anon + authenticated can read approved reviews
DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (approved = true);

-- SELECT (all): authenticated admins can read all reviews including unapproved
-- (auth_read_reviews already exists and remains unchanged)
