// functions/api/profiles/[slug].js
// GET: returns a profile bundle: { profile, images, documents }
// PUT (admin-only): updates profile fields (details only)

import { parseCookie, getUserFromSession } from "../../_lib/auth";

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function nowIso() {
  return new Date().toISOString();
}

async function requireAdmin(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);

  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}

function asJsonTextArray(value) {
  // Accept array or comma-separated string, store as JSON text in DB.
  if (Array.isArray(value)) {
    const arr = value.map((s) => String(s).trim()).filter(Boolean);
    return JSON.stringify(arr);
  }
  if (typeof value === "string") {
    const arr = value.split(",").map((s) => s.trim()).filter(Boolean);
    return JSON.stringify(arr);
  }
  return JSON.stringify([]);
}

function parseJsonArray(text) {
  try {
    const v = JSON.parse(text || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function cleanImagesArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x) => x && typeof x.url === "string" && x.url.trim())
    .map((x, idx) => ({
      url: String(x.url).trim(),
      alt: String(x.alt || "").trim(),
      kind: String(x.kind || "gallery").trim() || "gallery",
      sort_order:
        x.sort_order === undefined || x.sort_order === null || x.sort_order === "" ? idx : Number(x.sort_order),
    }));
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params?.slug;

  if (!slug) return json({ ok: false, error: "Missing slug" }, 400);

  if (request.method === "GET") {
    try {
      const profile = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();

      if (!profile) return json({ ok: false, error: "Not found" }, 404);

      let images = [];
      let documents = [];

      // These tables might not exist yet depending on your migrations; fail soft.
      try {
        const imgRes = await env.DB.prepare(
          "SELECT * FROM flavor_profile_images WHERE profile_id=? ORDER BY COALESCE(sort_order, 999999), created_at ASC"
        ).bind(profile.id).all();
        images = imgRes?.results || [];
      } catch {
        images = [];
      }

      try {
        const docRes = await env.DB.prepare(
          "SELECT * FROM flavor_profile_documents WHERE profile_id=? ORDER BY COALESCE(sort_order, 999999), created_at ASC"
        ).bind(profile.id).all();
        documents = docRes?.results || [];
      } catch {
        documents = [];
      }

      const normalized = {
        ...profile,
        dominant_terpenes: parseJsonArray(profile.dominant_terpenes),
        flavor_aroma: parseJsonArray(profile.flavor_aroma),
      };

      return json({ ok: true, profile: normalized, images, documents });
    } catch (err) {
      console.error("PROFILE GET ERROR:", err);
      return json({ ok: false, error: String(err?.message || err) }, 500);
    }
  }

  if (request.method === "PUT") {
    const gate = await requireAdmin(request, env);
    if (!gate.ok) return json({ ok: false, error: gate.error }, gate.status);

    let body = null;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    try {
      const existing = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();

      if (!existing) return json({ ok: false, error: "Not found" }, 404);

      const name = body?.name !== undefined ? String(body.name).trim() : existing.name;
      const flavor_type = body?.flavor_type !== undefined ? String(body.flavor_type).trim() : (existing.flavor_type || "");
      const flavor_category = body?.flavor_category !== undefined ? String(body.flavor_category).trim() : (existing.flavor_category || "");
      const description = body?.description !== undefined ? String(body.description).trim() : (existing.description || "");
      const mood = body?.mood !== undefined ? String(body.mood).trim() : (existing.mood || "");

      const dominant_terpenes = body?.dominant_terpenes !== undefined
        ? asJsonTextArray(body.dominant_terpenes)
        : (existing.dominant_terpenes || "[]");

      const flavor_aroma = body?.flavor_aroma !== undefined
        ? asJsonTextArray(body.flavor_aroma)
        : (existing.flavor_aroma || "[]");

      const sort_order =
        body?.sort_order === undefined
          ? existing.sort_order
          : (body.sort_order === null || body.sort_order === "" ? null : Number(body.sort_order));

      const is_active =
        body?.is_active === undefined
          ? existing.is_active
          : (body.is_active ? 1 : 0);

      const images = body?.images !== undefined ? cleanImagesArray(body.images) : null;

      const ts = nowIso();

      await env.DB.prepare(
        `UPDATE flavor_profiles
         SET name=?,
             flavor_type=?,
             flavor_category=?,
             description=?,
             dominant_terpenes=?,
             flavor_aroma=?,
             mood=?,
             sort_order=?,
             is_active=?,
             updated_at=?
         WHERE slug=?`
      )
        .bind(
          name,
          flavor_type,
          flavor_category,
          description,
          dominant_terpenes,
          flavor_aroma,
          mood,
          sort_order,
          is_active,
          ts,
          slug
        )
        .run();

      // Update images if client provided them (replace all existing rows)
      if (images !== null) {
        try {
          await env.DB.prepare("DELETE FROM flavor_profile_images WHERE profile_id=?")
            .bind(existing.id)
            .run();

          if (images.length) {
            const stmt = env.DB.prepare(
              "INSERT INTO flavor_profile_images (id, profile_id, url, alt, kind, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
            );
            for (const img of images) {
              await stmt
                .bind(crypto.randomUUID(), existing.id, img.url, img.alt, img.kind, img.sort_order)
                .run();
            }
          }
        } catch (e) {
          console.error("PROFILE IMAGES UPDATE ERROR:", e);
        }
      }

      const updated = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();

      const normalized = {
        ...updated,
        dominant_terpenes: parseJsonArray(updated.dominant_terpenes),
        flavor_aroma: parseJsonArray(updated.flavor_aroma),
      };

      return json({ ok: true, profile: normalized });
    } catch (err) {
      console.error("PROFILE PUT ERROR:", err);
      return json({ ok: false, error: String(err?.message || err) }, 500);
    }
  }

  return json({ ok: false, error: "Method not allowed" }, 405);
}
