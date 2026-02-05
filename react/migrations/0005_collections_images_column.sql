-- migrations/0005_collections_images_column.sql
-- Add per-collection image array storage.
-- Stored as JSON (TEXT). Example:
-- [
--   {"url":"https://.../hero.png","alt":"Hero banner","isPrimary":true},
--   {"url":"https://.../thumb1.png","alt":"Thumbnail","isPrimary":false}
-- ]

ALTER TABLE collections ADD COLUMN images_json TEXT DEFAULT '[]';
