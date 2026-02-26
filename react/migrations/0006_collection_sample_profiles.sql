-- migrations/0006_collection_sample_profiles.sql
-- Curated sample profile picks per collection (admin-managed).
-- Max-5 enforcement is handled by API logic.

CREATE UNIQUE INDEX IF NOT EXISTS idx_flavor_profiles_id_collection
  ON flavor_profiles(id, collection_id);

CREATE TABLE IF NOT EXISTS collection_sample_profiles (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id, collection_id) REFERENCES flavor_profiles(id, collection_id) ON DELETE CASCADE,
  UNIQUE (collection_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_sample_profiles_collection
  ON collection_sample_profiles(collection_id, is_active, sort_order, created_at);
