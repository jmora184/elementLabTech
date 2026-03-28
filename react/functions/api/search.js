// functions/api/search.js
// GET: returns a searchable catalog of active flavor profiles across collections,
// including isolate profiles for global header autocomplete.

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function routeForRow(row) {
  const collectionId = String(row?.collection_id || "").trim();
  const slug = String(row?.slug || "").trim();
  const isIsolate =
    /(^|-)isolates?($|-)/i.test(collectionId) ||
    /isolate/i.test(String(row?.collection_name || ""));

  if (isIsolate) {
    return `/isolates?profile=${encodeURIComponent(slug)}`;
  }

  return `/product/${encodeURIComponent(collectionId)}?profile=${encodeURIComponent(slug)}`;
}

export async function onRequestGet({ env }) {
  try {
    const res = await env.DB.prepare(
      `SELECT
         fp.id,
         fp.slug,
         fp.name,
         fp.collection_id,
         fp.flavor_type,
         fp.flavor_category,
         fp.sort_order,
         c.name AS collection_name,
         c.tagline AS collection_tagline,
         c.badge AS collection_badge
       FROM flavor_profiles AS fp
       JOIN collections AS c
         ON c.id = fp.collection_id
       WHERE fp.is_active = 1
         AND c.is_active = 1
       ORDER BY
         CASE WHEN fp.collection_id = 'isolate-collection' THEN 0 ELSE 1 END,
         COALESCE(c.sort_order, 999999),
         COALESCE(fp.sort_order, 999999),
         fp.name ASC`
    ).all();

    const items = Array.isArray(res?.results)
      ? res.results.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          collectionId: row.collection_id,
          collectionName: row.collection_name || "",
          collectionTagline: row.collection_tagline || "",
          collectionBadge: row.collection_badge || "",
          flavorType: row.flavor_type || "",
          flavorCategory: row.flavor_category || "",
          isIsolate:
            /(^|-)isolates?($|-)/i.test(String(row.collection_id || "")) ||
            /isolate/i.test(String(row.collection_name || "")),
          route: routeForRow(row),
        }))
      : [];

    return json({ ok: true, items });
  } catch (err) {
    console.error("SEARCH GET ERROR:", err);
    return json(
      { ok: false, error: String(err?.message || err || "Server error.") },
      500
    );
  }
}