// functions/api/collections/[id]/profiles.js
function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function badRequest(msg) {
  return json({ ok: false, error: msg }, 400);
}

function notFound(msg = "Not found") {
  return json({ ok: false, error: msg }, 404);
}


export async function onRequestGet(context) {
  const { env, params } = context;
  const collectionId = params?.id;
  if (!collectionId) return badRequest("Missing collection id.");

  try {
    const rows = await env.DB
      .prepare(
        "SELECT id, collection_id, slug, name, flavor_type, flavor_category, description, mood, dominant_terpenes, flavor_aroma, sort_order, is_active, created_at, updated_at " +
        "FROM flavor_profiles WHERE collection_id = ? AND is_active = 1 ORDER BY sort_order ASC, created_at ASC"
      )
      .bind(collectionId)
      .all();

    return json({ ok: true, profiles: rows?.results || [] });
  } catch (err) {
    console.error("PROFILES LIST ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}
