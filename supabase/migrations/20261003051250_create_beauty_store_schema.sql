/*
# Create Cimmple Beauty Store Schema

## Overview
Sets up the complete database schema for a Nigerian beauty store with an admin panel.
The store has a public storefront (anon access) and an admin backend (authenticated access).

## New Tables

### 1. products
Store catalog items for sale.
- id: UUID primary key
- name: Product name (required)
- description: Product description
- price: Price in naira (required)
- compare_at_price: Original price for showing discounts
- image_url: Primary product image
- image_urls: Array of additional product images
- category_id: Category identifier (required)
- badge: Optional badge text (e.g. "New", "Bestseller")
- in_stock: Stock status, defaults to true
- cart_adds: Count of times added to cart, defaults to 0
- variants: JSON array of variant options [{label, priceDelta}]
- created_at / updated_at: Timestamps

### 2. services
Bookable beauty services.
- id: UUID primary key
- name: Service name (required)
- description: Service description
- price: Price in naira (nullable for "contact for pricing")
- duration: Estimated duration text
- image_url: Primary service image
- image_urls: Array of additional images
- includes: Array of what's included in the service
- addons: JSON array of add-on options [{label, priceDelta}]
- in_stock: Availability, defaults to true
- created_at / updated_at: Timestamps

### 3. orders
Customer orders from the storefront.
- id: UUID primary key
- order_id: Human-readable order number like "CM-4821" (unique, required)
- customer_name, customer_phone, customer_email: Customer contact info
- address, apartment, city, state: Delivery address fields
- shipping_axis: Delivery axis/zone
- shipping_price: Shipping cost in naira, defaults to 0
- items: JSON array of order items [{productId, name, variant, qty, price}]
- subtotal: Order subtotal (required)
- total: Order total including shipping (required)
- payment_method: 'paystack' | 'transfer' | 'delivery' (required)
- payment_status: 'pending' | 'paid' | 'refunded', defaults to 'pending'
- status: Order workflow status, defaults to 'new'
- notes: Optional order notes
- created_at / updated_at: Timestamps

### 4. reviews
Product reviews from customers.
- id: UUID primary key
- product_id: References products(id) (required)
- customer_name: Reviewer name (required)
- rating: 1-5 (required, checked)
- comment: Review text (required)
- approved: Moderation flag, defaults to false
- created_at: Timestamp

### 5. customers
Customer records auto-created from orders.
- id: UUID primary key
- name: Customer name
- phone: Unique phone number (required)
- email: Customer email
- total_orders: Count of orders, defaults to 0
- total_spent: Total spending in naira, defaults to 0
- notes: Admin notes
- created_at / updated_at: Timestamps

### 6. settings
Key-value store for app configuration.
- key: Text primary key
- value: JSONB value (required)
- updated_at: Timestamp

## Security (RLS)

### products, services, settings
- Public (anon + authenticated) can SELECT
- Only authenticated can INSERT, UPDATE, DELETE

### reviews
- Public can SELECT only approved reviews
- Authenticated can SELECT all reviews, and INSERT/UPDATE/DELETE

### orders
- Anyone (anon + authenticated) can INSERT (guest checkout)
- Only authenticated can SELECT, UPDATE, DELETE

### customers
- Only authenticated can SELECT, INSERT, UPDATE, DELETE

## Storage
- Creates a public "product-images" storage bucket for product/service images
*/

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  compare_at_price integer,
  image_url text,
  image_urls text[],
  category_id text NOT NULL,
  badge text,
  in_stock boolean DEFAULT true,
  cart_adds integer DEFAULT 0,
  variants jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products"
  ON products FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 2. services
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer,
  duration text,
  image_url text,
  image_urls text[],
  includes text[],
  addons jsonb,
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_services" ON services;
CREATE POLICY "auth_insert_services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_services" ON services;
CREATE POLICY "auth_update_services"
  ON services FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_services" ON services;
CREATE POLICY "auth_delete_services"
  ON services FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 3. orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  apartment text,
  city text NOT NULL,
  state text NOT NULL,
  shipping_axis text,
  shipping_price integer DEFAULT 0,
  items jsonb NOT NULL,
  subtotal integer NOT NULL,
  total integer NOT NULL,
  payment_method text NOT NULL,
  payment_status text DEFAULT 'pending',
  status text DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_orders" ON orders;
CREATE POLICY "auth_read_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 4. reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) NOT NULL,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews"
  ON reviews FOR SELECT
  TO anon
  USING (approved = true);

DROP POLICY IF EXISTS "auth_read_reviews" ON reviews;
CREATE POLICY "auth_read_reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_reviews" ON reviews;
CREATE POLICY "auth_update_reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_reviews" ON reviews;
CREATE POLICY "auth_delete_reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 5. customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text UNIQUE NOT NULL,
  email text,
  total_orders integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_customers" ON customers;
CREATE POLICY "auth_read_customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_customers" ON customers;
CREATE POLICY "auth_insert_customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_customers" ON customers;
CREATE POLICY "auth_update_customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_customers" ON customers;
CREATE POLICY "auth_delete_customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 6. settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_settings" ON settings;
CREATE POLICY "auth_insert_settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_settings" ON settings;
CREATE POLICY "auth_delete_settings"
  ON settings FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================================
-- Storage bucket: product-images (public read)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_insert_product_images" ON storage.objects;
CREATE POLICY "auth_insert_product_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "auth_update_product_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
