// functions/api/collections/[id]/profiles.js
// GET: list profiles for a collection
// POST (admin-only): create a new flavor profile under a collection

import { parseCookie, getUserFromSession } from "../../../_lib/auth";

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function nowIso() {
  return new Date().toISOString();
}

async function requireAdmin(request, env) {
  // IMPORTANT: parseCookie expects a cookie HEADER STRING, not the Request object.
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);

  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params?.id;
  if (!id) return json({ ok: false, error: "Missing collection id" }, 400);

  if (request.method === "GET") {
    try {
      const res = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE collection_id=? AND is_active=1 ORDER BY COALESCE(sort_order, 999999), created_at ASC"
      )
        .bind(id)
        .all();

      return json({ ok: true, profiles: res?.results || [] });
    } catch (err) {
      console.error("PROFILES GET ERROR:", err);
      return json({ ok: false, error: String(err?.message || err) }, 500);
    }
  }

  if (request.method === "POST") {
    const gate = await requireAdmin(request, env);
    if (!gate.ok) return json({ ok: false, error: gate.error }, gate.status);

    let body = null;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    const name = String(body?.name || "").trim();
    if (!name) return json({ ok: false, error: "Name is required" }, 400);

    const slug = slugify(body?.slug || name);
    if (!slug) return json({ ok: false, error: "Slug is required" }, 400);

    const flavor_type = String(body?.flavor_type || "").trim();
    const flavor_category = String(body?.flavor_category || "").trim();
    const description = String(body?.description || "").trim();
    const mood = String(body?.mood || "").trim();

    // Arrays can be passed as arrays; store JSON text for now.
    const dominant_terpenes = Array.isArray(body?.dominant_terpenes)
      ? JSON.stringify(body.dominant_terpenes)
      : JSON.stringify([]);
    const flavor_aroma = Array.isArray(body?.flavor_aroma)
      ? JSON.stringify(body.flavor_aroma)
      : JSON.stringify([]);

    const sort_order =
      body?.sort_order === undefined || body?.sort_order === null || body?.sort_order === ""
        ? null
        : Number(body.sort_order);

    const idVal = crypto.randomUUID();
    const ts = nowIso();

    try {
      // ensure collection exists
      const col = await env.DB.prepare("SELECT id FROM collections WHERE id=?").bind(id).first();
      if (!col) return json({ ok: false, error: "Collection not found" }, 404);

      // unique slug
      const existing = await env.DB.prepare("SELECT id FROM flavor_profiles WHERE slug=?").bind(slug).first();
      if (existing) return json({ ok: false, error: "Slug already exists" }, 409);

      await env.DB.prepare(
        `INSERT INTO flavor_profiles
          (id, collection_id, slug, name, flavor_type, flavor_category, description, dominant_terpenes, flavor_aroma, mood, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      )
        .bind(
          idVal,
          id,
          slug,
          name,
          flavor_type,
          flavor_category,
          description,
          dominant_terpenes,
          flavor_aroma,
          mood,
          sort_order,
          ts,
          ts
        )
        .run();

      const created = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE id=?"
      )
        .bind(idVal)
        .first();

      return json({ ok: true, profile: created }, 201);
    } catch (err) {
      console.error("PROFILES POST ERROR:", err);
      return json({ ok: false, error: String(err?.message || err) }, 500);
    }
  }

  return json({ ok: false, error: "Method not allowed" }, 405);
}
