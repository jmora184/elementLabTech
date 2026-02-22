PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_auth.sql','2026-02-05 18:34:09');
INSERT INTO "d1_migrations" VALUES(2,'0002_products.sql','2026-02-05 18:34:09');
INSERT INTO "d1_migrations" VALUES(3,'0003_seed_amplify.sql','2026-02-05 18:34:09');
INSERT INTO "d1_migrations" VALUES(4,'0004_collections_tab_columns.sql','2026-02-05 20:43:39');
INSERT INTO "d1_migrations" VALUES(5,'0005_collections_images_column.sql','2026-02-05 20:48:39');
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
, role TEXT NOT NULL DEFAULT 'user');
INSERT INTO "users" VALUES(1,'jmora1845@gmail.com','pbkdf2$100000$4f7e6661a90fc811ec1b4f10831aa272$22f1a4231cd5931e4ec638e49f2acee8e5fb023e32a9a417594ecc828f5ddd7c','2026-02-05T18:37:14.224Z','admin');
INSERT INTO "users" VALUES(2,'elementlab12@gmaill.com','pbkdf2$100000$57203ed3d480590fb0b734d9abeacf54$6868ea2ac80d805c3b5e27de280a8c1a9a0dc25ae85dae68200e3ffcab71f663','2026-02-06T17:37:45.367Z','admin');
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "sessions" VALUES(1,1,'8bbdfaebd4b8c09c2039609fd7ff2cdd8c8da3b86ad0bc2b488a3caca4c52628','2026-02-19T18:37:14.274Z','2026-02-05T18:37:14.224Z');
INSERT INTO "sessions" VALUES(3,1,'5568617b4ba252fcdccc87ac29bc3a5c94e1a1af8d386bbff6fb93d40dc90d92','2026-02-19T23:54:01.894Z','2026-02-05T23:54:01.894Z');
INSERT INTO "sessions" VALUES(4,2,'32d260fb41257fb5a754ef79224c4081a5357fbf629be60e71b17e77f68a7329','2026-02-20T17:37:45.483Z','2026-02-06T17:37:45.367Z');
INSERT INTO "sessions" VALUES(5,2,'5d812ec1f588bf4a3e3f3a51fe281c519a5be21d59862f1f7ee3045a2553ee41','2026-02-20T17:37:53.276Z','2026-02-06T17:37:53.276Z');
INSERT INTO "sessions" VALUES(9,2,'78d59c566293ee4e7109fdc00758ecdba229a8f026d759b3ea4e2e52b2a3db9d','2026-02-28T18:29:44.420Z','2026-02-14T18:29:44.420Z');
CREATE TABLE collections (
  id TEXT PRIMARY KEY,                 
  name TEXT NOT NULL,                  
  tagline TEXT,
  description TEXT,
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, specs_json TEXT DEFAULT '[]', documents_json TEXT DEFAULT '[]', reviews_json TEXT DEFAULT '[]', shipping_md TEXT DEFAULT '', isolates_json TEXT DEFAULT '[]', terpenes_json TEXT DEFAULT '[]', images_json TEXT DEFAULT '[]');
INSERT INTO "collections" VALUES('fruity-fusion-forward','Amplify Collection','Fruit Collection','Juicy, vibrant fruit profiles with authentic character and lasting impression','',1,1,'2026-02-05 18:34:09','2026-02-21T19:08:48.073Z','[]','[]','[]','','[]','[{"name":"th","percent":23}]','[{"url":"https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/b02a71b2-a9f7-4529-9305-a36fcaece600/public","alt":"","isPrimary":true}]');
INSERT INTO "collections" VALUES('test','Benchmark Collection','Legacy Classics','Iconic profiles that define the standard','',3,1,'2026-02-06T17:40:13.059Z','2026-02-21T19:09:22.071Z','[]','[]','[]','','[]','[]','[{"url":"https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/250b2597-6807-45bf-e389-a41341bfca00/public","alt":"","isPrimary":true}]');
INSERT INTO "collections" VALUES('matrix-collection','Matrix Collection','Signature Blends','Engineered for beverage refreshment, indulgent confection body, and vibrant candy expression.','',2,1,'2026-02-15T07:28:25.225Z','2026-02-21T19:41:08.046Z','[]','[]','[]','Free shipping over $100. New orders: 7–14 business days. In-stock items ship within 48 hours of processing.','[]','[]','[{"url":"https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/601f8770-39fc-40fb-6670-8a855aaaf600/public","alt":"","isPrimary":true}]');
INSERT INTO "collections" VALUES('emerald-cut','Emerald Cut','Fresh Frozen','Naturally derived profiles delivering true-to-source character with depth and complexity.','',4,1,'2026-02-15T07:36:29.640Z','2026-02-21T19:22:06.322Z','[]','[]','[]','','[]','[]','[{"url":"https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/eb8a9b93-b528-4a94-66c1-571ed99bbb00/public","alt":"","isPrimary":true}]');
CREATE TABLE flavor_profiles (
  id TEXT PRIMARY KEY,                 
  collection_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,           
  name TEXT NOT NULL,                  
  flavor_type TEXT,
  flavor_category TEXT,
  description TEXT,
  mood TEXT,
  dominant_terpenes TEXT,              
  flavor_aroma TEXT,                   
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);
INSERT INTO "flavor_profiles" VALUES('profile_blazin_banana','fruity-fusion-forward','blazin-banana','Banana Shake','Banana Shake','','Blazin Banana delivers ripe, caramelized banana layered with subtle tropical sweetness and a warm, lightly spiced finish','Euphoric / Uplifting','["Isoamyl acetate","Ethyl maltol"]','["banana","candy","sweet"]',0,1,'2026-02-05 18:34:09','2026-02-17T04:50:13.881Z');
INSERT INTO "flavor_profiles" VALUES('0f11f3e7-289f-4212-942c-c9b2603efe4f','test','test','Bubba Kush','','OG & Kush','Rich earthy notes layered with sweet hash, roasted coffee, and subtle cocoa undertones. Smooth, heavy, and slightly nutty on the finish.','Relaxed • Sedating','["β-Myrcene","β-Caryophyllene","Limonene","Humulene"]','["Earthy","Musky","Spice","Woody"]',1,1,'2026-02-07T03:11:21.292Z','2026-02-21T22:48:42.424Z');
INSERT INTO "flavor_profiles" VALUES('1e807ad6-6f7f-491c-b187-8a217304213e','test','test1','Jack Herer','Jack Herer','Citrus & Hazy','A bright, pine-forward profile layered with fresh citrus zest and subtle herbal spice, delivering a crisp, uplifting experience.','Uplifting  Focused','["Terpinolene","β-Caryophyllene","Limonene"]','["Fresh","Slightly Resinous","Citrus","Hazy"]',0,1,'2026-02-10T13:10:01.548Z','2026-02-21T22:36:20.844Z');
INSERT INTO "flavor_profiles" VALUES('c551b983-c0ee-4428-8916-c40df8e82c8f','fruity-fusion-forward','blackberry-noir','Blackberry Noir','','Fruit, Candy','A deep, jammy blackberry profile with dark, sweet richness and subtle wine-like depth. Gentle tartness is layered with a soft floral accent and a clean, freshly crushed finish','Smooth • Comforting • Slightly Indulgent','["Limonene","Myrcene","Linalool","Beta-Caryophyllene"]','["Sweet Fruit","Candy"]',1,1,'2026-02-14T19:48:44.053Z','2026-02-14T20:25:20.521Z');
INSERT INTO "flavor_profiles" VALUES('e94efc79-b287-41df-86d2-1b196f66f545','fruity-fusion-forward','blueberry-burst','Blueberry Burst','Blueberry Burst','Candy-Inspired Fruit','A vibrant, juicy blueberry profile bursting with bright sweetness, subtle tartness, and a smooth candy-like finish.','Uplifting • Playful • Bright','["Myrcene","Linalool","Limonene","Alpha-Pinene"]','["Ripe blueberry skin","mild tart pop","soft smooth finish"]',2,1,'2026-02-14T20:04:15.331Z','2026-02-14T20:59:19.484Z');
INSERT INTO "flavor_profiles" VALUES('ccb72a65-2833-466c-8574-e3716904b8c8','fruity-fusion-forward','strawberry-luxe','Strawberry Luxe','Strawberry Luxe','Fruit, Candy','Opens with a bright, volatile red-fruit top note, quickly settling into dense strawberry flesh and a silky jammy core, finished with a soft floral lift that rounds the profile','Elegant • Uplifting • Smooth','["Myrcene","Linalool","Limonene","Gamma-Terpinene","Beta-Caryophyllene"]','["Fresh crushed strawberries","Delicate floral nuance","Sweet red-fruit brightness"]',3,1,'2026-02-14T20:49:06.480Z','2026-02-21T22:22:07.667Z');
INSERT INTO "flavor_profiles" VALUES('1bfb12a5-037e-4447-981c-2f3a8119cea2','fruity-fusion-forward','orange-sunshine','Orange Sunshine','Orange Sunshine','Fruit, Candy','Lively orange zest opens the profile, followed by sweet sun-warmed pulp and a gentle peel bitterness — crisp, energetic, refreshing','Energizing • Uplifting','["Limonene","Myrcene","Alpha-Pinene","Gamma-Terpinene","Beta-Myrcene"]','["Expressed orange peel oils upfront with sweet citrus flesh"]',4,1,'2026-02-14T21:19:33.993Z','2026-02-14T21:50:21.199Z');
INSERT INTO "flavor_profiles" VALUES('56a3870a-e35f-40e8-8723-4c3018ef4c11','fruity-fusion-forward','kiwi-chill','Kiwi Chill','Kiwi Chill','Fruit, Candy','Sharp green kiwi on the top note with immediate tang, unfolding into juicy tropical flesh, with a balanced sweet-tart core','Energizing • Playful','["Limonene","Myrcene","Linalool","Alpha-Pinene","Gamma-Terpinene"]','["Crisp acidity  top note","soft tropical pulp beneath","green","zesty","vibrant  tropical sweetness"]',5,1,'2026-02-14T21:54:55.802Z','2026-02-14T22:00:01.124Z');
INSERT INTO "flavor_profiles" VALUES('515ee685-a104-4053-807e-5c9217c47de8','fruity-fusion-forward','watermelon-slush','Watermelon Slush','Watermelon Slush','Fruit, Candy','Fresh watermelon flesh opens soft and airy, with watery sweetness and a subtle green rind nuance underneath.','Playful • Uplifting','["Cis-3-Hexenol","Linalool","Limonene","Myrcene","Beta-Caryophyllene"]','["Fresh-cut melon","watery sweetness"]',6,1,'2026-02-14T22:46:06.720Z','2026-02-21T22:20:03.214Z');
INSERT INTO "flavor_profiles" VALUES('8da8d088-312c-45eb-9feb-1828702b24ec','fruity-fusion-forward','pineapple-sol','Pineapple Sol','Pineapple Sol','Fruit, Candy','High-toned tropical fruit leads with crisp sweetness and controlled tang, rounded by ripe pineapple body.','Energizing • Playful','["Ethyl butyrate","Limonene","Myrcene","Gamma-Terpinene","Linalool"]','["Bold","Sunny","Uplifting"]',7,1,'2026-02-14T22:54:26.906Z','2026-02-14T23:01:33.051Z');
INSERT INTO "flavor_profiles" VALUES('24c90b3c-0132-4ebe-8fef-39b9ee1e8c6c','fruity-fusion-forward','peach-silk','Peach Nectar','','','Sun-warmed peach with balanced sweetness and subtle tartness, creamy stone-fruit body.','Comforting/ Dreamy','["Gamma-Decalactone","Linalool","Limonene","Beta-Caryophyllene"]','["Fruit sweetness","velvety","ripe nectar"]',8,1,'2026-02-14T23:52:37.341Z','2026-02-21T22:21:13.315Z');
INSERT INTO "flavor_profiles" VALUES('21114ac8-1a3a-4412-8f29-425cdc00f405','fruity-fusion-forward','mango-nectar','Mango Nectar','Mango Nectar','Fruit, Candy','Fresh-cut mango with rich nectar body, lingering fruit sweetness with subtle floral warmth.','Uplifting','["Myrcene","Limonene","lTerpinolene","Linalool","Beta-Caryophyllene"]','["sweet ripe","slightly citrusy"]',9,1,'2026-02-15T01:03:16.618Z','2026-02-21T22:24:13.403Z');
INSERT INTO "flavor_profiles" VALUES('2c3f3f28-1548-4b96-8cec-a6dcb1ed764f','fruity-fusion-forward','lemon-zest','Lemon Zest','Lemon Zest','Fruit, Candy','Juicy citrus flesh with subtle rind bitternes','Energizing • Focused','["Limonene","Beta-Pinene","Gamma-Terpinene","Citral","Neral + Geranial","Myrcene"]','["Sweet Meyer Lemon","Lemonade"]',10,1,'2026-02-15T01:37:11.328Z','2026-02-15T01:47:50.532Z');
INSERT INTO "flavor_profiles" VALUES('d77c7096-76b3-41da-be3f-e38cb0a92444','fruity-fusion-forward','lime-note','Lime Note','','Fruit, Sweet','lime zest hits immediately on the top note, sharply green and high-toned, settling into tart citrus flesh with subtle bitterness','Energizing • Crisp • Focused','["Limonene – bright citrus backbone  Beta-Pinene – sharp green peel character  Gamma-Terpinene – sweet citrus nuance  Citral (Neral + Geranial) – tart lime flesh  Alpha-Pinene (trace) – fresh green lift"]','["Intense lime zest on the nose with sharp green citrus oil and bright acidic pulp beneath","supported by subtle rind structure."]',11,1,'2026-02-15T05:10:04.612Z','2026-02-15T05:11:15.395Z');
INSERT INTO "flavor_profiles" VALUES('607d5efe-d284-493f-9b20-973ac4144604','fruity-fusion-forward','vineyard-grape','Vineyard Grape','','','','Euphoric, Relaxed','["Myrcene","Linalool","Beta-Caryophyllene","Alpha-Terpineol","Limonene"]','["Rich grape skin on the nose with concentrated purple fruit beneath wine-toned depth"]',12,1,'2026-02-15T05:30:39.114Z','2026-02-15T05:30:54.571Z');
INSERT INTO "flavor_profiles" VALUES('3cc695b5-fea6-47f1-8f31-268a4c81a10b','fruity-fusion-forward','green-apple','Green Apple','Green Apple','Fruit, Candy','Crisp malic tang, opening into juicy tart flesh and a clean orchard finish','Energetic, Playful','["Hexyl acetate","Cis-3-Hexenol","Limonen","Alpha-Farnesene","Linaloolal"]','["Tartness","green fruit esters upfront."]',13,1,'2026-02-15T05:55:33.353Z','2026-02-15T06:10:34.709Z');
INSERT INTO "flavor_profiles" VALUES('40557ae6-739e-47c5-ad25-70d25726788d','matrix-collection','green-jelly-rancher','Green Jelly Rancher','Green Jelly Rancher','Fruit, Candy','A vivid green apple candy profile bursting with tart sweetness.','Uplifting • Energetic','["Limonene","Terpinolene","Beta-Pinene","Malic-style tart"]','["Green apple peel","Sugared citrus zest","Subtle candy-shell sweetness"]',0,1,'2026-02-15T20:50:51.665Z','2026-02-21T21:57:02.415Z');
INSERT INTO "flavor_profiles" VALUES('b741a258-bce5-429b-87b7-66836a8b3c82','matrix-collection','yogurt-tart','Yogurt Tart','Yogurt Tart','Candy, Tart','A creamy yogurt profile layered with bright citrus tang and a sweet tart candy finish.','Uplifting','["Limonene","Linalool","Terpineol"]','["Fresh cultured yogurt","Light citrus zest","Powdered sugar sweetness"]',1,1,'2026-02-15T21:43:56.197Z','2026-02-17T05:20:42.203Z');
INSERT INTO "flavor_profiles" VALUES('4b5ba659-79a9-46e5-a66c-b5d99cde0833','matrix-collection','hawiiana-snow-cone','Hawiiana Snow Cone','','','Tropical shaved ice profile bursting with pineapple, citrus, and candy-sweet island fruit','Euphoric • Refreshing','["Limonene","Myrcene","Terpinolene"]','["Fresh pineapple juice","bright orange-citrus zest","sweet red fruit syrup"]',2,1,'2026-02-16T04:15:36.711Z','2026-02-17T05:00:16.753Z');
INSERT INTO "flavor_profiles" VALUES('3b8f1709-b55c-42bb-a675-92ca2714af6d','matrix-collection','cola','Cola','Cola','','sparkling citrus, warm spice, and smooth caramel sweetness','Comforting','["Limonene","Beta-Caryophyllene","Nerolidol"]','["fresh citrus zest","warm clove","light vanilla"]',16,1,'2026-02-16T04:20:15.895Z','2026-02-21T18:32:53.458Z');
INSERT INTO "flavor_profiles" VALUES('74f2659e-eed5-461c-a024-c8bd24e1365e','matrix-collection','baha-blast','Baha Blast','Baha Blast','Drinks','Tropical citrus soda bursting with lime, exotic fruit, and icy refreshment','Uplifting','["Limonene","Terpinolene","Myrcene","Linalool"]','["Refreshing • Tropical"]',17,1,'2026-02-16T04:23:56.034Z','2026-02-21T18:40:49.285Z');
INSERT INTO "flavor_profiles" VALUES('f232a9af-cb72-41d4-a83e-d78a271fe76e','matrix-collection','hubba-bubba','Hubba Bubba','Hubba Bubba','Candy','Sweet bubblegum chew mid-palate Bright strawberry/watermelon/ banana candy upfront','Uplifting, Playful','["Limonene","Linalool","Terpinolene","Ethyl Maltol"]','["Mixed berry candy","Light banana-strawberry nuance"]',5,1,'2026-02-17T05:11:46.096Z','2026-02-17T05:19:34.358Z');
INSERT INTO "flavor_profiles" VALUES('fd63c277-d4e5-4748-8a02-f78504e33fa4','matrix-collection','mojito','Mojito','Mojito','Drinks','A crisp lime and fresh mint cocktail profile with cooling sweetness and sparkling citrus lift.','Uplifting, Refreshing','["Limonene","Beta-Pinene","Myrcene","Eucalyptol"]','["Fresh lime peel","Crushed garden mint","Light cane sugar"]',6,1,'2026-02-17T05:23:46.745Z','2026-02-17T05:25:01.469Z');
INSERT INTO "flavor_profiles" VALUES('7ae4fa75-0873-41fb-8ca4-17bfd492cec3','matrix-collection','white-gusher','White Gusher','White Gusher','Candy','A creamy tropical fruit candy bursting with sweet citrus and soft candy-coated juiciness.','Euphoric, Playfully','["Limonene","Terpinolene","Linaloo"]','["Sweet pineapple-peach","Light citrus zest","creamy powdered sugar coating"]',7,1,'2026-02-17T05:28:53.890Z','2026-02-17T05:41:27.895Z');
INSERT INTO "flavor_profiles" VALUES('207afbda-3187-4c8c-b8ed-7a0f2719e7aa','matrix-collection','pistachio-baklava','Pistachio Baklava','Pistachio Baklava','Dessert','A decadent pistachio pastry layered with golden honey, toasted nuts, and warm spiced syrup.','Rich, Comforting','["Beta-Caryophyllene","Linalool","Myrcene"]','["Roasted pistachio","Honey drizzle  Buttery phyllo pastry","Light cinnamon spice"]',8,1,'2026-02-17T05:44:45.288Z','2026-02-17T05:49:50.927Z');
INSERT INTO "flavor_profiles" VALUES('c7bf3315-efb7-4946-a480-aec63292578a','matrix-collection','tres-leches','Tres Leches','Tres Leches','Dessert','A velvety three-milk cake profile layered with sweet cream, soft vanilla, and delicate sponge warmth','Comforting','["Linalool","Terpineol","Myrcene"]','["Sweet condensed milk  Light vanilla bean  Fresh cream"]',9,1,'2026-02-17T05:51:48.330Z','2026-02-17T05:54:32.026Z');
INSERT INTO "flavor_profiles" VALUES('42c6c989-6932-4895-86a4-ce779aa4c47f','matrix-collection','strawberries-cream','Strawberries & Cream','Strawberries & Cream','Dessert','A luscious blend of ripe strawberries layered with sweet cream and soft vanilla warmth.','Comforting, Uplifting','["Limonene","Linalool","Terpineol"]','["Strawberries","Honey syrup","Condensed cream"]',10,1,'2026-02-17T05:58:26.451Z','2026-02-17T05:58:26.451Z');
INSERT INTO "flavor_profiles" VALUES('fc1a8a6f-74cd-49ff-8313-be7efa15b900','matrix-collection','rainbow-belts','Rainbow Belts','','','','','[]','[]',11,1,'2026-02-17T05:59:24.790Z','2026-02-17T05:59:24.790Z');
INSERT INTO "flavor_profiles" VALUES('e09a443e-65ce-4a77-b07b-b2df5c6af6c9','matrix-collection','bomb-pop','Bomb Pop','','','','','[]','[]',12,1,'2026-02-17T05:59:40.205Z','2026-02-17T05:59:40.205Z');
INSERT INTO "flavor_profiles" VALUES('75b7535f-7928-4aa7-8662-d1cbd79ad616','matrix-collection','sour-patch-watermelone','Sour Patch Watermelon','','','','','[]','[]',13,1,'2026-02-17T06:00:00.585Z','2026-02-17T06:00:11.832Z');
INSERT INTO "flavor_profiles" VALUES('f0ea7234-d667-4eea-b8c4-d6ebd63db445','matrix-collection','peach-rings','Peach Rings','','','','','[]','[]',14,1,'2026-02-21T18:29:36.105Z','2026-02-21T18:29:36.105Z');
INSERT INTO "flavor_profiles" VALUES('53b0439c-07e2-4ec8-8aea-7515b67f2c62','matrix-collection','cotton-candy','Cotton Candy','','','','','[]','[]',15,1,'2026-02-21T18:30:00.565Z','2026-02-21T18:30:00.565Z');
INSERT INTO "flavor_profiles" VALUES('943df2e5-bc39-4b2b-93bc-f4d6e9064aaf','matrix-collection','rosemary-olive','Rosemary Olive','','','Rosemary Olive','','[]','[]',16,1,'2026-02-21T18:30:49.010Z','2026-02-21T18:30:49.010Z');
INSERT INTO "flavor_profiles" VALUES('5c8c5b08-dd5f-4571-801a-4a9a38de8b4f','matrix-collection','cucumber-mint','Cucumber Mint','','Mixers, Drinks','','','[]','[]',17,1,'2026-02-21T18:32:08.772Z','2026-02-21T18:32:08.772Z');
INSERT INTO "flavor_profiles" VALUES('ab9d3bba-17da-4f89-b70d-b335f037e39f','matrix-collection','honeydew-nectar','Cereal Milk','','','','','[]','[]',18,1,'2026-02-21T18:33:17.965Z','2026-02-21T18:41:24.362Z');
INSERT INTO "flavor_profiles" VALUES('b19552ff-5e3c-462e-a800-7fd5a2b099ba','fruity-fusion-forward','grapefruit','Ruby Grapefruit','','','','','[]','[]',14,1,'2026-02-21T18:35:00.280Z','2026-02-21T18:36:21.362Z');
INSERT INTO "flavor_profiles" VALUES('3e9507a9-2682-4448-868b-c9181599ca11','fruity-fusion-forward','bergamont','Bergamont','','','','','[]','[]',15,1,'2026-02-21T18:36:07.841Z','2026-02-21T18:36:07.841Z');
INSERT INTO "flavor_profiles" VALUES('65ec65d2-6ed4-4d99-89b6-59bcdf0b7100','fruity-fusion-forward','calamansi','Calamansi','','','','','[]','[]',16,1,'2026-02-21T18:36:34.731Z','2026-02-21T18:36:34.731Z');
INSERT INTO "flavor_profiles" VALUES('16423351-ed81-4106-be76-74be847b8c2d','fruity-fusion-forward','tangerine','Tangerine','','','','','[]','[]',17,1,'2026-02-21T18:36:51.099Z','2026-02-21T18:36:51.099Z');
INSERT INTO "flavor_profiles" VALUES('d43fdf07-51b0-4eae-8e70-b0c9a281471f','fruity-fusion-forward','cherry-amarena','Cherry Amarena','','','','','[]','[]',18,1,'2026-02-21T18:37:59.720Z','2026-02-21T18:37:59.720Z');
INSERT INTO "flavor_profiles" VALUES('8f5b6b3e-f041-492b-b674-09fff28e3e4b','matrix-collection','strawberry-nesiquik','Strawberry Nesiquik','','','','','[]','[]',19,1,'2026-02-21T18:40:17.920Z','2026-02-21T18:40:17.920Z');
INSERT INTO "flavor_profiles" VALUES('7d370f88-01a3-4d31-a92a-5ece919f118c','emerald-cut','savory-backbone','Savory Backbone','','','','','[]','[]',0,1,'2026-02-21T18:51:44.171Z','2026-02-21T18:51:44.171Z');
INSERT INTO "flavor_profiles" VALUES('561ebe8a-3d22-41f0-a35a-deb25d093b61','test','classic-pine','OG Kush','','OG & Kush','Deep earthy pine layered with sharp lemon peel and a strong diesel-fuel backbone. Slight woody spice on the exhale with a smooth, resinous finish.','Relaxed, Euphoric','["β-Myrcene","Limonene","β-Caryophyllene","α-Pinene"]','["Pungent","Gassy","Pine","Dank Herbal"]',2,1,'2026-02-21T18:52:31.749Z','2026-02-21T22:15:24.633Z');
INSERT INTO "flavor_profiles" VALUES('0ee3a156-4b1b-40a0-b9fc-9c319b02bafc','matrix-collection','tajin','Tajin','','','','','[]','[]',20,1,'2026-02-21T18:55:37.960Z','2026-02-21T18:55:37.960Z');
INSERT INTO "flavor_profiles" VALUES('4e25eeb5-e712-486c-af1d-854a186e5f41','matrix-collection','dark-chocolate-sea-salt','Dark Chocolate Sea Salt','','','','','[]','[]',21,1,'2026-02-21T18:56:01.059Z','2026-02-21T18:56:01.059Z');
INSERT INTO "flavor_profiles" VALUES('8f860ce4-d6ae-47a2-a3f1-d8eadf045884','matrix-collection','19','Matcha Cream','','','matcha','','[]','[]',17,1,'2026-02-21T18:57:40.240Z','2026-02-21T18:57:59.897Z');
INSERT INTO "flavor_profiles" VALUES('b9233aed-32d1-46cc-b957-b316f4c7e6d9','matrix-collection','smokey-cherry','Smokey Cherry','','','','','[]','[]',8,1,'2026-02-21T18:58:49.408Z','2026-02-21T21:19:40.516Z');
INSERT INTO "flavor_profiles" VALUES('86f9eb4b-2e58-4bbe-9037-1afd448bbb4c','matrix-collection','charred-coconut','Ube Vanilla Cream','','','','','[]','[]',23,1,'2026-02-21T19:00:20.970Z','2026-02-21T19:01:24.301Z');
INSERT INTO "flavor_profiles" VALUES('2bd9ca31-eec8-4166-a3b4-27ae847da8d6','matrix-collection','black-sesame-honey','Black Sesame Honey','','','','','[]','[]',24,1,'2026-02-21T19:01:49.553Z','2026-02-21T19:01:49.553Z');
INSERT INTO "flavor_profiles" VALUES('92892c02-81b4-4128-ad49-000d74fde4b7','fruity-fusion-forward','honeydew-slice','Honeydew Slice','','','','','[]','[]',19,1,'2026-02-21T19:05:59.071Z','2026-02-21T19:05:59.071Z');
INSERT INTO "flavor_profiles" VALUES('d8e70dde-39e5-4086-b05f-f64a5b7fd28e','fruity-fusion-forward','passion-fruit','Passion Fruit','','','','','[]','[]',20,1,'2026-02-21T19:06:14.893Z','2026-02-21T19:06:14.893Z');
INSERT INTO "flavor_profiles" VALUES('f67de1ae-dc93-483c-8401-773a1e1f54e7','fruity-fusion-forward','white-lychee','White Lychee','','','','','[]','[]',21,1,'2026-02-21T19:07:30.265Z','2026-02-21T19:07:30.265Z');
INSERT INTO "flavor_profiles" VALUES('baadce78-8f9c-4a96-8970-455f4b71bb44','fruity-fusion-forward','charrd-coconut','Charr''d Coconut','','','','','[]','[]',22,1,'2026-02-21T19:14:30.894Z','2026-02-21T19:14:30.894Z');
INSERT INTO "flavor_profiles" VALUES('5f5a8a88-3da4-4fa1-b960-0602a37820f1','fruity-fusion-forward','jackfruit-nectar','Jackfruit Nectar','','','','','[]','[]',23,1,'2026-02-21T19:15:15.076Z','2026-02-21T19:15:15.076Z');
CREATE TABLE flavor_profile_images (
  id TEXT PRIMARY KEY,                 
  profile_id TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  kind TEXT NOT NULL DEFAULT 'gallery', 
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES flavor_profiles(id) ON DELETE CASCADE
);
INSERT INTO "flavor_profile_images" VALUES('c46cac0e-a996-4a63-8862-22ad08285df7','c551b983-c0ee-4428-8916-c40df8e82c8f','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/781dac39-06d6-4ca9-be08-7a4abd949a00/public','','gallery',0,'2026-02-14 20:25:20');
INSERT INTO "flavor_profile_images" VALUES('5215fc37-22a4-4639-bdd4-5b0da6e7e7d7','e94efc79-b287-41df-86d2-1b196f66f545','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/3d84afd7-c296-40cb-93f8-8036b0f99800/public','','gallery',0,'2026-02-14 20:59:19');
INSERT INTO "flavor_profile_images" VALUES('424efe93-5a65-4aa2-980c-0844d073b66d','1bfb12a5-037e-4447-981c-2f3a8119cea2','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/ead020c5-7e7d-4f1c-1ac4-84824136ba00/public','','gallery',0,'2026-02-14 21:50:21');
INSERT INTO "flavor_profile_images" VALUES('9029b97b-0e05-4406-a640-3c31162410c9','56a3870a-e35f-40e8-8723-4c3018ef4c11','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/e8a21ba7-9fd2-4dfe-9164-25e999afb500/public','','gallery',0,'2026-02-14 22:00:01');
INSERT INTO "flavor_profile_images" VALUES('23be19aa-54ba-4f14-a9c9-4f808ba5d1bf','8da8d088-312c-45eb-9feb-1828702b24ec','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/bf3548bb-12cb-4a87-c3b7-0f026c0b9100/public','','gallery',0,'2026-02-14 23:01:33');
INSERT INTO "flavor_profile_images" VALUES('09799345-a9cd-4372-9720-3597756960e1','2c3f3f28-1548-4b96-8cec-a6dcb1ed764f','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/861c036f-c7f5-45f0-cd99-80cddfe91500/public','','gallery',0,'2026-02-15 01:47:50');
INSERT INTO "flavor_profile_images" VALUES('ac0513c9-df63-47b7-8b08-af56a1f38863','d77c7096-76b3-41da-be3f-e38cb0a92444','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/a8deaccf-5ed0-48a1-c0b4-8555bbac4800/public','','gallery',0,'2026-02-15 05:11:15');
INSERT INTO "flavor_profile_images" VALUES('c597ac91-f281-43ec-94f8-c8f1e52012e2','607d5efe-d284-493f-9b20-973ac4144604','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/68d6844b-899b-47c7-0910-d344bbcd3800/public','','gallery',0,'2026-02-15 05:30:54');
INSERT INTO "flavor_profile_images" VALUES('ee33f713-1016-44aa-913c-81765ace8f02','3cc695b5-fea6-47f1-8f31-268a4c81a10b','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/b11f08b2-50f3-4d2e-d9c3-28ba06672500/public','','gallery',0,'2026-02-15 06:10:34');
INSERT INTO "flavor_profile_images" VALUES('71b85ff2-c49c-450d-a3a1-abe77c9e392b','profile_blazin_banana','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/ce6a7c16-85da-4412-5b89-5ed3653a5a00/public','','gallery',0,'2026-02-17 04:50:14');
INSERT INTO "flavor_profile_images" VALUES('d7132807-619e-465c-ba29-1f21141cbf1a','4b5ba659-79a9-46e5-a66c-b5d99cde0833','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/af352bcc-299f-4088-e205-f38b2a127e00/public','','gallery',0,'2026-02-17 05:00:16');
INSERT INTO "flavor_profile_images" VALUES('80cb6fae-1d1a-4d68-a166-3d99ac0a27b8','f232a9af-cb72-41d4-a83e-d78a271fe76e','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/ac17ce90-19be-4d53-5f94-28113aee9100/public','','gallery',0,'2026-02-17 05:19:34');
INSERT INTO "flavor_profile_images" VALUES('8656c63e-cb1c-424c-bca1-3d03a10e0290','b741a258-bce5-429b-87b7-66836a8b3c82','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/37364ca5-99da-4545-ebd4-0e6932e8b600/public','','gallery',0,'2026-02-17 05:20:42');
INSERT INTO "flavor_profile_images" VALUES('67d6fbb6-ead7-4ba2-b871-f5c14fae834d','fd63c277-d4e5-4748-8a02-f78504e33fa4','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/e157873b-215e-4ed9-c3bd-0a2fcbe0d000/public','','gallery',0,'2026-02-17 05:25:01');
INSERT INTO "flavor_profile_images" VALUES('30170a72-bc7f-4bf6-9873-1b55f93d6d89','7ae4fa75-0873-41fb-8ca4-17bfd492cec3','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/be3219c8-5f9c-4db3-785b-b2aeab004100/public','','gallery',0,'2026-02-17 05:41:28');
INSERT INTO "flavor_profile_images" VALUES('02ada27d-d004-495b-9adb-a1c68d6ac197','207afbda-3187-4c8c-b8ed-7a0f2719e7aa','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/351ab43e-303b-47cd-ea1b-2b8069fe3700/public','','gallery',0,'2026-02-17 05:49:51');
INSERT INTO "flavor_profile_images" VALUES('594d419d-807a-40be-a05d-48049b4186a7','42c6c989-6932-4895-86a4-ce779aa4c47f','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/6c1ee414-321d-4cdb-4473-ff1a0e3a4f00/public','','gallery',0,'2026-02-17 05:58:26');
INSERT INTO "flavor_profile_images" VALUES('17e8eeaa-490b-4dad-9f68-af274dff87b1','3b8f1709-b55c-42bb-a675-92ca2714af6d','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/562a9871-6bf8-4445-4aec-a980896d4800/public','','gallery',0,'2026-02-21 18:32:53');
INSERT INTO "flavor_profile_images" VALUES('e0f3f962-9af0-44ac-a7e6-809736ebcf2d','74f2659e-eed5-461c-a024-c8bd24e1365e','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/e8383a63-214c-439a-8293-8ddc8f1e1800/public','','gallery',0,'2026-02-21 18:40:49');
INSERT INTO "flavor_profile_images" VALUES('e34aca72-33ea-4f4d-ab18-c9f5ebdff037','40557ae6-739e-47c5-ad25-70d25726788d','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/eadf2939-3ee5-453f-c42e-28fba8a5f500/public','','gallery',0,'2026-02-21 21:57:02');
INSERT INTO "flavor_profile_images" VALUES('b7945734-0174-4bb2-8b3d-8837f7f8f473','515ee685-a104-4053-807e-5c9217c47de8','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/80b4b0d7-67c1-4500-b2e8-7f860eddfd00/public','','gallery',0,'2026-02-21 22:20:03');
INSERT INTO "flavor_profile_images" VALUES('50bd0680-260f-405a-a205-a22c68ea4ebb','24c90b3c-0132-4ebe-8fef-39b9ee1e8c6c','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/16566cf7-c891-4f9c-e736-e81ee9802700/public','','gallery',0,'2026-02-21 22:21:13');
INSERT INTO "flavor_profile_images" VALUES('eb567a0a-8f73-425d-9593-3278504b8c40','ccb72a65-2833-466c-8574-e3716904b8c8','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/67a8c287-5c26-4d58-7b02-ada1c224fc00/public','','gallery',0,'2026-02-21 22:22:07');
INSERT INTO "flavor_profile_images" VALUES('0bec7e3b-e033-46b1-9c9d-3442914e0efb','21114ac8-1a3a-4412-8f29-425cdc00f405','https://imagedelivery.net/baxs2o45Tnrb0NNB17MUxg/5615f952-1e0c-45a5-49e3-848363d32200/public','','gallery',0,'2026-02-21 22:24:13');
CREATE TABLE flavor_profile_documents (
  id TEXT PRIMARY KEY,                 
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'other', 
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES flavor_profiles(id) ON DELETE CASCADE
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',5);
INSERT INTO "sqlite_sequence" VALUES('users',2);
INSERT INTO "sqlite_sequence" VALUES('sessions',9);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_flavor_profiles_collection
  ON flavor_profiles(collection_id, sort_order);
CREATE INDEX idx_profile_images_profile
  ON flavor_profile_images(profile_id, sort_order);
CREATE INDEX idx_profile_docs_profile
  ON flavor_profile_documents(profile_id, sort_order);
