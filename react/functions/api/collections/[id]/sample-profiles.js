import { parseCookie, getUserFromSession } from "../../../_lib/auth.js";

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

export async function onRequest(context) {
  const { request, env, params } = context;
  const collectionId = String(params?.id || "").trim();
  if (!collectionId) return json({ ok: false, error: "Missing collection id" }, 400);

  if (request.method === "GET") {
    try {
      const res = await env.DB.prepare(
        `SELECT
           csp.id,
           csp.collection_id,
           csp.profile_id,
           csp.sort_order,
           csp.is_active,
           csp.created_at,
           csp.updated_at,
           fp.slug,
           fp.name
         FROM collection_sample_profiles csp
         JOIN flavor_profiles fp ON fp.id = csp.profile_id
         WHERE csp.collection_id = ? AND csp.is_active = 1
         ORDER BY COALESCE(csp.sort_order, 999999), csp.created_at ASC`
      )
        .bind(collectionId)
        .all();

      return json({ ok: true, sampleProfiles: res?.results || [] });
    } catch (err) {
      console.error("SAMPLE PROFILES GET ERROR:", err);
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

    const profileId = String(body?.profile_id || "").trim();
    if (!profileId) return json({ ok: false, error: "profile_id is required" }, 400);

    let sortOrder =
      body?.sort_order === undefined || body?.sort_order === null || body?.sort_order === ""
        ? null
        : Number(body.sort_order);

    try {
      const collection = await env.DB.prepare("SELECT id FROM collections WHERE id=? LIMIT 1")
        .bind(collectionId)
        .first();
      if (!collection) return json({ ok: false, error: "Collection not found" }, 404);

      const profile = await env.DB.prepare(
        "SELECT id, collection_id FROM flavor_profiles WHERE id=? AND is_active=1 LIMIT 1"
      )
        .bind(profileId)
        .first();
      if (!profile) return json({ ok: false, error: "Profile not found" }, 404);
      if (String(profile.collection_id) !== collectionId) {
        return json({ ok: false, error: "Profile must belong to this collection" }, 400);
      }

      const activeCountRow = await env.DB.prepare(
        "SELECT COUNT(*) AS cnt FROM collection_sample_profiles WHERE collection_id=? AND is_active=1"
      )
        .bind(collectionId)
        .first();
      const activeCount = Number(activeCountRow?.cnt || 0);
      if (activeCount >= 5) {
        return json({ ok: false, error: "You can only select up to 5 sample profiles." }, 400);
      }

      const exists = await env.DB.prepare(
        "SELECT id FROM collection_sample_profiles WHERE collection_id=? AND profile_id=? LIMIT 1"
      )
        .bind(collectionId, profileId)
        .first();
      if (exists) {
        return json({ ok: false, error: "Profile already selected for this sample set." }, 409);
      }

      if (sortOrder === null || Number.isNaN(sortOrder)) {
        const nextRow = await env.DB.prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort FROM collection_sample_profiles WHERE collection_id=?"
        )
          .bind(collectionId)
          .first();
        sortOrder = Number(nextRow?.next_sort ?? 0);
      }

      const idVal = crypto.randomUUID();
      const ts = nowIso();

      await env.DB.prepare(
        `INSERT INTO collection_sample_profiles
          (id, collection_id, profile_id, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      )
        .bind(idVal, collectionId, profileId, sortOrder, ts, ts)
        .run();

      const created = await env.DB.prepare(
        `SELECT
           csp.id,
           csp.collection_id,
           csp.profile_id,
           csp.sort_order,
           csp.is_active,
           csp.created_at,
           csp.updated_at,
           fp.slug,
           fp.name
         FROM collection_sample_profiles csp
         JOIN flavor_profiles fp ON fp.id = csp.profile_id
         WHERE csp.id = ?
         LIMIT 1`
      )
        .bind(idVal)
        .first();

      return json({ ok: true, sampleProfile: created }, 201);
    } catch (err) {
      console.error("SAMPLE PROFILES POST ERROR:", err);
      return json({ ok: false, error: String(err?.message || err) }, 500);
    }
  }

  return json({ ok: false, error: "Method not allowed" }, 405);
}
