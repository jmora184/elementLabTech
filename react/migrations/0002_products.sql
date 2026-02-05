-- migrations/0002_products.sql
-- Product collections + flavor profiles (Amplify) + assets
-- Also adds users.role for admin privileges (default: 'user').

-- Add role column for admin gating (run once).
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Collections (one per /product/:collectionSlug page)
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,                 -- slug, e.g. 'fruity-fusion-forward'
  name TEXT NOT NULL,                  -- display name, e.g. 'Amplify Collection'
  tagline TEXT,
  description TEXT,
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Flavor profiles (many per collection)
CREATE TABLE IF NOT EXISTS flavor_profiles (
  id TEXT PRIMARY KEY,                 -- uuid
  collection_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,           -- e.g. 'blazin-banana'
  name TEXT NOT NULL,                  -- e.g. 'Blazin Banana'
  flavor_type TEXT,
  flavor_category TEXT,
  description TEXT,
  mood TEXT,
  dominant_terpenes TEXT,              -- JSON array string
  flavor_aroma TEXT,                   -- JSON array string
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flavor_profiles_collection
  ON flavor_profiles(collection_id, sort_order);

-- Images for a profile
CREATE TABLE IF NOT EXISTS flavor_profile_images (
  id TEXT PRIMARY KEY,                 -- uuid
  profile_id TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  kind TEXT NOT NULL DEFAULT 'gallery', -- hero | gallery | label
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES flavor_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_images_profile
  ON flavor_profile_images(profile_id, sort_order);

-- Documents for a profile
CREATE TABLE IF NOT EXISTS flavor_profile_documents (
  id TEXT PRIMARY KEY,                 -- uuid
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'other', -- coa | spec | sds | other
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES flavor_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_docs_profile
  ON flavor_profile_documents(profile_id, sort_order);
