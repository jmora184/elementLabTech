// functions/api/collections/[id].js
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
  const id = params?.id;
  if (!id) return badRequest("Missing collection id.");

  try {
    const row = await env.DB
      .prepare("SELECT id, name, tagline, description, badge, sort_order, is_active, created_at, updated_at FROM collections WHERE id = ? AND is_active = 1")
      .bind(id)
      .first();

    if (!row) return notFound("Collection not found.");
    return json({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION GET ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}
