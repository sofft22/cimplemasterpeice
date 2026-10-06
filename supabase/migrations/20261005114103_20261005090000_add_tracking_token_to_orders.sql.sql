-- ============================================================
-- Add tracking_token to orders
-- ============================================================
-- 1. Add nullable text column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token text;

-- 2. Enforce uniqueness (no two orders share a token)
CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_key
  ON orders (tracking_token)
  WHERE tracking_token IS NOT NULL;

-- 3. Backfill existing rows that have no token yet
UPDATE orders
SET tracking_token = encode(gen_random_bytes(24), 'hex')
WHERE tracking_token IS NULL;

-- 4. Trigger: auto-generate token on INSERT when null
CREATE OR REPLACE FUNCTION set_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_tracking_token ON orders;
CREATE TRIGGER trg_set_tracking_token
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_token();
