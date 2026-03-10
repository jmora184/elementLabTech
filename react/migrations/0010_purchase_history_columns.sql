-- Migration: extend purchases table for Stripe Checkout webhook history
ALTER TABLE purchases ADD COLUMN stripe_session_id TEXT;
ALTER TABLE purchases ADD COLUMN payment_status TEXT;
ALTER TABLE purchases ADD COLUMN customer_email TEXT;
ALTER TABLE purchases ADD COLUMN currency TEXT;
ALTER TABLE purchases ADD COLUMN shipping_name TEXT;
ALTER TABLE purchases ADD COLUMN shipping_address1 TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_stripe_session_id
  ON purchases(stripe_session_id);