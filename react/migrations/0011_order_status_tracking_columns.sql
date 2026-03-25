-- Migration: add order status + tracking fields for purchase history
ALTER TABLE purchases ADD COLUMN order_status TEXT DEFAULT 'processing';
ALTER TABLE purchases ADD COLUMN order_status_updated_at DATETIME;
ALTER TABLE purchases ADD COLUMN tracking_number TEXT;
ALTER TABLE purchases ADD COLUMN carrier TEXT;
ALTER TABLE purchases ADD COLUMN shipped_at DATETIME;
