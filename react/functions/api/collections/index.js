// functions/api/collections/index.js
// Cloudflare Pages Function route: /api/collections
//
// GET  -> list active collections for homepage
// POST -> create a new collection (admin only)
//
// Tab columns:
// - specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json
// Images column:
// - images_json
//
// Assumes:
// - Shared auth helper at: functions/_lib/auth.js exporting parseCookie() and getUserFromSession()
// - D1 binding named DB: env.DB

import { parseCookie, getUserFromSession } from "../../_lib/auth.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
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

async function requireAdmin(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);

  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export async function onRequestGet({ env }) {
  try {
    const res = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, images_json, created_at, updated_at " +
        "FROM collections " +
        "WHERE is_active=1 " +
        "ORDER BY COALESCE(sort_order, 999999), created_at ASC"
    ).all();

    return json({ ok: true, collections: res?.results || [] });
  } catch (err) {
    console.error("COLLECTIONS LIST ERROR:", err);
    return json({ ok: false, error: "Server error." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  // Admin gate
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  // Parse body
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const name = String(payload.name || "").trim();
  if (!name) return json({ ok: false, error: "Name is required." }, 400);

  const id = String(payload.id || payload.slug || "").trim() || slugify(name);
  const badge = String(payload.badge || "").trim();
  const tagline = String(payload.tagline || "").trim();
  const description = String(payload.description || "").trim();
  const sortOrder =
    payload.sort_order === "" || payload.sort_order === null || typeof payload.sort_order === "undefined"
      ? 0
      : Number(payload.sort_order);
  const isActive = payload.is_active === false || payload.is_active === 0 ? 0 : 1;

  // Initialize tab content columns
  const specsJson = "[]";
  const documentsJson = "[]";
  const reviewsJson = "[]";
  const shippingMd = "";
  const isolatesJson = "[]";
  const terpenesJson = "[]";

  // Initialize images column
  // Optional: allow client to send an initial images array; otherwise default []
  // Expected shape: [{ url, alt, isPrimary }]
  let imagesJson = "[]";
  if (Array.isArray(payload.images)) {
    // Keep it small/safe: only store url/alt/isPrimary fields
    const cleaned = payload.images
      .filter((x) => x && typeof x.url === "string" && x.url.trim())
      .map((x) => ({
        url: String(x.url).trim(),
        alt: String(x.alt || "").trim(),
        isPrimary: Boolean(x.isPrimary),
      }));
    imagesJson = JSON.stringify(cleaned);
  }

  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  try {
    await env.DB.prepare(
      "INSERT INTO collections (" +
        "id, name, badge, tagline, description, sort_order, is_active, " +
        "specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, " +
        "images_json, " +
        "created_at, updated_at" +
        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        name,
        badge,
        tagline,
        description,
        sortOrder,
        isActive,
        specsJson,
        documentsJson,
        reviewsJson,
        shippingMd,
        isolatesJson,
        terpenesJson,
        imagesJson,
        createdAt,
        updatedAt
      )
      .run();

    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, " +
        "specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, " +
        "images_json, " +
        "created_at, updated_at " +
        "FROM collections WHERE id=?"
    )
      .bind(id)
      .first();

    return json({ ok: true, collection: row }, 201);
  } catch (err) {
    console.error("COLLECTION CREATE ERROR:", err);
    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("unique") || msg.includes("constraint")) {
      return json({ ok: false, error: "A collection with that Id/Slug already exists." }, 409);
    }
    if (msg.includes("no such column") && msg.includes("images_json")) {
      return json(
        { ok: false, error: "DB is missing images_json. Run migration 0005_collections_images_column.sql." },
        500
      );
    }
    return json({ ok: false, error: "Server error." }, 500);
  }
}
