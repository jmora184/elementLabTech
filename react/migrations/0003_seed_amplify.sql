-- migrations/0003_seed_amplify.sql
-- Seed the Amplify collection and initial flavor profiles.

INSERT OR IGNORE INTO collections (id, name, tagline, description, badge, sort_order, is_active)
VALUES (
  'fruity-fusion-forward',
  'Amplify Collection',
  'Inspired Profile Collection',
  'A curated set of terpene-inspired profiles for flavor exploration.',
  '🍌🍓🍇',
  0,
  1
);

-- One starter profile (you can add more later via admin UI)
INSERT OR IGNORE INTO flavor_profiles (
  id, collection_id, slug, name, flavor_type, flavor_category, description, mood,
  dominant_terpenes, flavor_aroma, sort_order, is_active
) VALUES (
  'profile_blazin_banana',
  'fruity-fusion-forward',
  'blazin-banana',
  'Blazin Banana',
  'Fruit / Candy',
  'Candy',
  'A bold banana-candy forward profile with sweet, smooth finish.',
  'Euphoric / Uplifting',
  '["Isoamyl acetate","Ethyl maltol"]',
  '["banana","candy","sweet"]',
  0,
  1
);
