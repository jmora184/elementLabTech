// functions/api/profiles/[slug]/sku-options.js
// Route: /api/profiles/:slug/sku-options
//
// GET -> returns only the mapped secondary SKU/flavor options for the selected primary profile

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeProfileRow(row) {
  if (!row) return null;
  return {
    ...row,
    dominant_terpenes: parseJsonArray(row.dominant_terpenes),
    flavor_aroma: parseJsonArray(row.flavor_aroma),
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export async function onRequestGet({ env, params }) {
  const slug = String(params?.slug || "").trim();
  if (!slug) return json({ ok: false, error: "Missing slug." }, 400);

  try {
    const primary = await env.DB.prepare(
      `SELECT id, collection_id, slug, name, description, dominant_terpenes, flavor_aroma
       FROM flavor_profiles
       WHERE slug=? AND is_active=1
       LIMIT 1`
    )
      .bind(slug)
      .first();

    if (!primary) {
      return json({ ok: false, error: "Profile not found." }, 404);
    }

    let rows = [];
    try {
      const result = await env.DB.prepare(
        `SELECT
           fp.id,
           fp.collection_id,
           fp.slug,
           fp.name,
           fp.flavor_type,
           fp.flavor_category,
           fp.description,
           fp.mood,
           fp.dominant_terpenes,
           fp.flavor_aroma,
           fpsm.sort_order
         FROM flavor_profile_sku_mappings AS fpsm
         JOIN flavor_profiles AS fp
           ON fp.id = fpsm.secondary_profile_id
         WHERE fpsm.primary_profile_id = ?
           AND fpsm.is_active = 1
           AND fp.is_active = 1
         ORDER BY COALESCE(fpsm.sort_order, 999999), COALESCE(fp.sort_order, 999999), fp.name ASC`
      )
        .bind(primary.id)
        .all();

      rows = Array.isArray(result?.results) ? result.results : [];
    } catch (err) {
      const message = String(err?.message || err || "");
      if (message.toLowerCase().includes("no such table")) {
        return json(
          {
            ok: false,
            error: "DB is missing flavor_profile_sku_mappings. Run migration 0012_flavor_profile_sku_mappings.sql.",
          },
          500
        );
      }
      throw err;
    }

    return json({
      ok: true,
      primary: normalizeProfileRow(primary),
      options: rows.map(normalizeProfileRow),
    });
  } catch (err) {
    console.error("PROFILE SKU OPTIONS GET ERROR:", err);
    return json({ ok: false, error: String(err?.message || err || "Server error.") }, 500);
  }
}