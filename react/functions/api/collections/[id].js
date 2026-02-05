// functions/api/collections/[id].js
// Route: /api/collections/:id
//
// GET -> fetch a single collection (includes tab fields + images_json)
// PUT -> admin-only update for core fields and tab fields/images
//
// Assumes:
// - Shared auth helper at: functions/_lib/auth.js exporting parseCookie() and getUserFromSession()
// - D1 binding named DB: env.DB

import { parseCookie, getUserFromSession } from "../../_lib/auth.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
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

function toText(v) {
  if (v === null || typeof v === "undefined") return null;
  return String(v);
}

function toNumber(v) {
  if (v === null || typeof v === "undefined" || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool01(v) {
  if (v === null || typeof v === "undefined") return null;
  return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
}

function toJsonText(v) {
  if (v === null || typeof v === "undefined") return null;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export async function onRequestGet({ env, params }) {
  const id = params?.id;
  if (!id) return json({ ok: false, error: "Missing collection id." }, 400);

  try {
    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, " +
        "specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, " +
        "created_at, updated_at " +
        "FROM collections WHERE id=?"
    )
      .bind(id)
      .first();

    if (!row) return json({ ok: false, error: "Collection not found." }, 404);
    return json({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION GET ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}

export async function onRequestPut({ request, env, params }) {
  const id = params?.id;
  if (!id) return json({ ok: false, error: "Missing collection id." }, 400);

  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  // Core fields
  const name = toText(payload.name);
  const tagline = toText(payload.tagline);
  const description = toText(payload.description);
  const badge = toText(payload.badge);
  const sortOrder = toNumber(payload.sort_order);
  const isActive = toBool01(payload.is_active);

  // Tabs/images (accept either *_json strings or arrays/objects)
  const specsJson = toJsonText(payload.specs_json ?? payload.specs);
  const documentsJson = toJsonText(payload.documents_json ?? payload.documents);
  const reviewsJson = toJsonText(payload.reviews_json ?? payload.reviews);
  const shippingMd = toText(payload.shipping_md ?? payload.shipping);
  const isolatesJson = toJsonText(payload.isolates_json ?? payload.isolates);
  const terpenesJson = toJsonText(payload.terpenes_json ?? payload.terpenes);
  const imagesJson = toJsonText(payload.images_json ?? payload.images);

  const sets = [];
  const binds = [];

  function add(col, val) {
    if (val === null) return;
    sets.push(`${col}=?`);
    binds.push(val);
  }

  add("name", name);
  add("tagline", tagline);
  add("description", description);
  add("badge", badge);
  if (sortOrder !== null) add("sort_order", sortOrder);
  if (isActive !== null) add("is_active", isActive);

  add("specs_json", specsJson);
  add("documents_json", documentsJson);
  add("reviews_json", reviewsJson);
  add("shipping_md", shippingMd);
  add("isolates_json", isolatesJson);
  add("terpenes_json", terpenesJson);
  add("images_json", imagesJson);

  if (sets.length === 0) return json({ ok: false, error: "No fields to update." }, 400);

  const updatedAt = new Date().toISOString();
  sets.push("updated_at=?");
  binds.push(updatedAt);

  binds.push(id);

  try {
    await env.DB.prepare(`UPDATE collections SET ${sets.join(", ")} WHERE id=?`).bind(...binds).run();

    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, " +
        "specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, " +
        "created_at, updated_at " +
        "FROM collections WHERE id=?"
    )
      .bind(id)
      .first();

    return json({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION UPDATE ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}
