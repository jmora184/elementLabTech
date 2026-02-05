-- migrations/0004_collections_tab_columns.sql
-- Add per-collection tab content storage (Specs/Documents/Reviews/Shipping/Isolates/Terpenes).
-- Stored as JSON (TEXT) or markdown-ish TEXT for shipping.

ALTER TABLE collections ADD COLUMN specs_json TEXT DEFAULT '[]';
ALTER TABLE collections ADD COLUMN documents_json TEXT DEFAULT '[]';
ALTER TABLE collections ADD COLUMN reviews_json TEXT DEFAULT '[]';
ALTER TABLE collections ADD COLUMN shipping_md TEXT DEFAULT '';
ALTER TABLE collections ADD COLUMN isolates_json TEXT DEFAULT '[]';
ALTER TABLE collections ADD COLUMN terpenes_json TEXT DEFAULT '[]';
