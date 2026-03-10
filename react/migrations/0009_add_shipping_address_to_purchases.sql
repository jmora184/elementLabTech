-- Migration: Add shipping_address column to purchases table
ALTER TABLE purchases ADD COLUMN shipping_address TEXT; -- JSON string of shipping address
