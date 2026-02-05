// functions/api/profiles/[slug].js
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
  const slug = params?.slug;
  if (!slug) return badRequest("Missing profile slug.");

  try {
    const profile = await env.DB
      .prepare(
        "SELECT id, collection_id, slug, name, flavor_type, flavor_category, description, mood, dominant_terpenes, flavor_aroma, sort_order, is_active, created_at, updated_at " +
        "FROM flavor_profiles WHERE slug = ? AND is_active = 1"
      )
      .bind(slug)
      .first();

    if (!profile) return notFound("Profile not found.");

    const images = await env.DB
      .prepare("SELECT id, profile_id, url, alt, kind, sort_order, created_at FROM flavor_profile_images WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC")
      .bind(profile.id)
      .all();

    const documents = await env.DB
      .prepare("SELECT id, profile_id, title, url, doc_type, sort_order, created_at FROM flavor_profile_documents WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC")
      .bind(profile.id)
      .all();

    return json({
      ok: true,
      profile: {
        ...profile,
        dominant_terpenes: profile.dominant_terpenes ? JSON.parse(profile.dominant_terpenes) : [],
        flavor_aroma: profile.flavor_aroma ? JSON.parse(profile.flavor_aroma) : []
      },
      images: images?.results || [],
      documents: documents?.results || []
    });
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}
