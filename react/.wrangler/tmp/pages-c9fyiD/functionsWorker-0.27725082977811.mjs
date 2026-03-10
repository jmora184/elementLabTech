var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// _lib/auth.js
function json(status, data, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  return new Response(JSON.stringify(data), { status, headers });
}
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function cookieOptions(opts = {}) {
  const defaults = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
    // 14 days
  };
  return { ...defaults, ...opts };
}
function setCookie(headers, name, value, options = {}) {
  const opts = cookieOptions(options);
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  headers.append("Set-Cookie", parts.join("; "));
}
function parseCookie(cookieHeader) {
  const out = {};
  const str = cookieHeader || "";
  str.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}
function randomToken(byteLen = 32) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashPassword(password, iters = DEFAULT_PBKDF2_ITERS) {
  const safeIters = Math.min(Number(iters) || DEFAULT_PBKDF2_ITERS, 1e5);
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(password)),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: safeIters,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(bits);
  return `pbkdf2$${safeIters}$${toHex(salt)}$${toHex(hash)}`;
}
async function verifyPassword(password, stored) {
  try {
    const [alg, itersStr, saltHex, hashHex] = String(stored || "").split("$");
    if (alg !== "pbkdf2") return false;
    const iters = Math.min(Number(itersStr) || DEFAULT_PBKDF2_ITERS, 1e5);
    const salt = fromHex(saltHex);
    const expected = fromHex(hashHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(String(password)),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: iters,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const actual = new Uint8Array(bits);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
async function getUserFromSession(env, sessionToken) {
  if (!env?.DB || !sessionToken) return null;
  const row = await env.DB.prepare(
    `
    SELECT u.id as id, u.email as email, u.role as role, s.expires_at as expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
    LIMIT 1
  `
  ).bind(sessionToken).first();
  if (!row) return null;
  const exp = Date.parse(row.expires_at);
  if (Number.isFinite(exp) && exp < Date.now()) return null;
  return { id: row.id, email: row.email, role: row.role || "user" };
}
function toHex(u8) {
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const clean = String(hex || "").trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
var encoder, DEFAULT_PBKDF2_ITERS;
var init_auth = __esm({
  "_lib/auth.js"() {
    init_functionsRoutes_0_7157080303585999();
    encoder = new TextEncoder();
    __name(json, "json");
    __name(normalizeEmail, "normalizeEmail");
    __name(cookieOptions, "cookieOptions");
    __name(setCookie, "setCookie");
    __name(parseCookie, "parseCookie");
    __name(randomToken, "randomToken");
    DEFAULT_PBKDF2_ITERS = 1e5;
    __name(hashPassword, "hashPassword");
    __name(verifyPassword, "verifyPassword");
    __name(getUserFromSession, "getUserFromSession");
    __name(toHex, "toHex");
    __name(fromHex, "fromHex");
    __name(timingSafeEqual, "timingSafeEqual");
  }
});

// api/collections/[id]/documents/[docId]/download.js
function withCors(headers = {}) {
  return { ...headers, ...CORS_HEADERS };
}
function json2(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCors({ "Content-Type": "application/json", ...extraHeaders })
  });
}
function safeJsonArray(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function requireLoginIfConfigured(request, env) {
  if (String(env.DOCS_REQUIRE_LOGIN || "") !== "1") return { ok: true };
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  return { ok: true, user };
}
async function onRequestOptions() {
  return new Response(null, { status: 204, headers: withCors() });
}
async function onRequestGet({ request, env, params }) {
  const id = params?.id;
  const docId = params?.docId;
  if (!id || !docId) return json2({ ok: false, error: "Missing params." }, 400);
  const gate = await requireLoginIfConfigured(request, env);
  if (!gate.ok) return json2({ ok: false, error: gate.error }, gate.status);
  if (!env.DOCS_BUCKET) {
    return json2({ ok: false, error: "R2 bucket binding missing (DOCS_BUCKET)." }, 500);
  }
  const row = await env.DB.prepare("SELECT documents_json FROM collections WHERE id=?").bind(id).first();
  if (!row) return json2({ ok: false, error: "Collection not found." }, 404);
  const docs = safeJsonArray(row.documents_json);
  const doc = docs.find((d) => String(d?.id || "") === String(docId));
  if (!doc) return json2({ ok: false, error: "Document not found." }, 404);
  const key = String(doc.key || "");
  if (!key) return json2({ ok: false, error: "Document missing key." }, 500);
  let obj;
  try {
    obj = await env.DOCS_BUCKET.get(key);
  } catch (err) {
    console.error("R2 GET ERROR:", err);
    return json2({ ok: false, error: "Failed to fetch file." }, 502);
  }
  if (!obj) return json2({ ok: false, error: "File not found in storage." }, 404);
  const fileName = String(doc.fileName || doc.title || "document").replace(/[\r\n"]/g, "_");
  const contentType = doc.contentType || obj.httpMetadata?.contentType || "application/octet-stream";
  const headers = new Headers(
    withCors({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": `attachment; filename="${fileName}"`
    })
  );
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { status: 200, headers });
}
var CORS_HEADERS;
var init_download = __esm({
  "api/collections/[id]/documents/[docId]/download.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(withCors, "withCors");
    __name(json2, "json");
    __name(safeJsonArray, "safeJsonArray");
    __name(requireLoginIfConfigured, "requireLoginIfConfigured");
    __name(onRequestOptions, "onRequestOptions");
    __name(onRequestGet, "onRequestGet");
  }
});

// api/collections/[id]/documents/upload.js
function json3(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...extraHeaders }
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
function safeJsonArray2(text) {
  if (!text) return [];
  if (Array.isArray(text)) return text;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function sanitizeFileName(name) {
  const base = String(name || "document").replace(/[/\\?%*:|"<>]/g, "_");
  return base.length > 120 ? base.slice(0, 120) : base;
}
async function onRequestOptions2() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS2 } });
}
async function onRequestPost({ request, env, params }) {
  const id = params?.id;
  if (!id) return json3({ ok: false, error: "Missing collection id." }, 400);
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json3({ ok: false, error: auth.error }, auth.status);
  if (!env.DOCS_BUCKET) {
    return json3(
      {
        ok: false,
        error: "R2 bucket binding missing. Add an R2 bucket binding named DOCS_BUCKET in Cloudflare Pages + wrangler.jsonc."
      },
      500
    );
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return json3({ ok: false, error: "Expected multipart/form-data." }, 400);
  }
  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const type = String(form.get("type") || "").trim();
  if (!file || typeof file === "string") {
    return json3({ ok: false, error: "Missing file field." }, 400);
  }
  const maxBytes = 25 * 1024 * 1024;
  if (file.size && file.size > maxBytes) {
    return json3({ ok: false, error: "File too large (max 25MB)." }, 413);
  }
  const row = await env.DB.prepare("SELECT documents_json FROM collections WHERE id=?").bind(id).first();
  if (!row) return json3({ ok: false, error: "Collection not found." }, 404);
  const docId = crypto.randomUUID();
  const fileName = sanitizeFileName(file.name || "document");
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const key = `collections/${id}/${docId}${ext ? "." + ext : ""}`;
  const contentType = file.type || "application/octet-stream";
  const buf = await file.arrayBuffer();
  try {
    await env.DOCS_BUCKET.put(key, buf, {
      httpMetadata: { contentType },
      customMetadata: {
        collection_id: id,
        doc_id: docId,
        title: title || fileName,
        type: type || ""
      }
    });
  } catch (err) {
    console.error("R2 PUT ERROR:", err);
    return json3({ ok: false, error: "Failed to store file." }, 502);
  }
  const docs = safeJsonArray2(row.documents_json);
  const entry = {
    id: docId,
    title: title || fileName,
    type: type || "",
    fileName,
    contentType,
    size: Number(file.size || buf.byteLength || 0),
    key,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  docs.push(entry);
  try {
    await env.DB.prepare("UPDATE collections SET documents_json=?, updated_at=datetime('now') WHERE id=?").bind(JSON.stringify(docs), id).run();
  } catch (err) {
    console.error("DB UPDATE ERROR:", err);
    try {
      await env.DOCS_BUCKET.delete(key);
    } catch {
    }
    return json3({ ok: false, error: "Failed to update database." }, 500);
  }
  return json3({
    ok: true,
    doc: {
      ...entry,
      url: `/api/collections/${id}/documents/${docId}/download`
    },
    documents: docs
  });
}
var CORS_HEADERS2;
var init_upload = __esm({
  "api/collections/[id]/documents/upload.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS2 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json3, "json");
    __name(requireAdmin, "requireAdmin");
    __name(safeJsonArray2, "safeJsonArray");
    __name(sanitizeFileName, "sanitizeFileName");
    __name(onRequestOptions2, "onRequestOptions");
    __name(onRequestPost, "onRequestPost");
  }
});

// api/collections/[id]/documents/[docId].js
function json4(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS3, ...extraHeaders }
  });
}
async function requireAdmin2(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
function safeJsonArray3(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function onRequestOptions3() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS3 } });
}
async function onRequestDelete({ request, env, params }) {
  const id = params?.id;
  const docId = params?.docId;
  if (!id || !docId) return json4({ ok: false, error: "Missing params." }, 400);
  const auth = await requireAdmin2(request, env);
  if (!auth.ok) return json4({ ok: false, error: auth.error }, auth.status);
  if (!env.DOCS_BUCKET) return json4({ ok: false, error: "R2 bucket binding missing (DOCS_BUCKET)." }, 500);
  const row = await env.DB.prepare("SELECT documents_json FROM collections WHERE id=?").bind(id).first();
  if (!row) return json4({ ok: false, error: "Collection not found." }, 404);
  const docs = safeJsonArray3(row.documents_json);
  const idx = docs.findIndex((d) => String(d?.id || "") === String(docId));
  if (idx < 0) return json4({ ok: false, error: "Document not found." }, 404);
  const [doc] = docs.splice(idx, 1);
  const key = String(doc?.key || "");
  try {
    await env.DB.prepare("UPDATE collections SET documents_json=?, updated_at=datetime('now') WHERE id=?").bind(JSON.stringify(docs), id).run();
  } catch (err) {
    console.error("DB UPDATE ERROR:", err);
    return json4({ ok: false, error: "Failed to update database." }, 500);
  }
  if (key) {
    try {
      await env.DOCS_BUCKET.delete(key);
    } catch (err) {
      console.error("R2 DELETE ERROR:", err);
    }
  }
  return json4({ ok: true, deleted: { id: docId } });
}
var CORS_HEADERS3;
var init_docId = __esm({
  "api/collections/[id]/documents/[docId].js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS3 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json4, "json");
    __name(requireAdmin2, "requireAdmin");
    __name(safeJsonArray3, "safeJsonArray");
    __name(onRequestOptions3, "onRequestOptions");
    __name(onRequestDelete, "onRequestDelete");
  }
});

// api/collections/[id]/sample-profiles/[profileId].js
function json5(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
async function requireAdmin3(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
async function onRequest(context) {
  const { request, env, params } = context;
  const collectionId = String(params?.id || "").trim();
  const profileId = String(params?.profileId || "").trim();
  if (!collectionId || !profileId) {
    return json5({ ok: false, error: "Missing route params" }, 400);
  }
  if (request.method !== "DELETE") {
    return json5({ ok: false, error: "Method not allowed" }, 405);
  }
  const gate = await requireAdmin3(request, env);
  if (!gate.ok) return json5({ ok: false, error: gate.error }, gate.status);
  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM collection_sample_profiles WHERE collection_id=? AND profile_id=? LIMIT 1"
    ).bind(collectionId, profileId).first();
    if (!existing) {
      return json5({ ok: false, error: "Sample profile link not found" }, 404);
    }
    await env.DB.prepare(
      "DELETE FROM collection_sample_profiles WHERE collection_id=? AND profile_id=?"
    ).bind(collectionId, profileId).run();
    return json5({ ok: true });
  } catch (err) {
    console.error("SAMPLE PROFILE DELETE ERROR:", err);
    return json5({ ok: false, error: String(err?.message || err) }, 500);
  }
}
var init_profileId = __esm({
  "api/collections/[id]/sample-profiles/[profileId].js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    __name(json5, "json");
    __name(requireAdmin3, "requireAdmin");
    __name(onRequest, "onRequest");
  }
});

// api/collections/[id]/profiles.js
function json6(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
function slugify(input) {
  return String(input || "").trim().toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function cleanImagesArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x.url === "string" && x.url.trim()).map((x, idx) => ({
    url: String(x.url).trim(),
    alt: String(x.alt || "").trim(),
    kind: String(x.kind || "gallery").trim() || "gallery",
    sort_order: x.sort_order === void 0 || x.sort_order === null || x.sort_order === "" ? idx : Number(x.sort_order)
  }));
}
async function requireAdmin4(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
async function onRequest2(context) {
  const { request, env, params } = context;
  const id = params?.id;
  if (!id) return json6({ ok: false, error: "Missing collection id" }, 400);
  if (request.method === "GET") {
    try {
      const res = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE collection_id=? AND is_active=1 ORDER BY COALESCE(sort_order, 999999), created_at ASC"
      ).bind(id).all();
      return json6({ ok: true, profiles: res?.results || [] });
    } catch (err) {
      console.error("PROFILES GET ERROR:", err);
      return json6({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "POST") {
    const gate = await requireAdmin4(request, env);
    if (!gate.ok) return json6({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json6({ ok: false, error: "Invalid JSON" }, 400);
    }
    const name = String(body?.name || "").trim();
    if (!name) return json6({ ok: false, error: "Name is required" }, 400);
    const slug = slugify(body?.slug || name);
    if (!slug) return json6({ ok: false, error: "Slug is required" }, 400);
    const flavor_type = String(body?.flavor_type || "").trim();
    const flavor_category = String(body?.flavor_category || "").trim();
    const description = String(body?.description || "").trim();
    const mood = String(body?.mood || "").trim();
    const dominant_terpenes = Array.isArray(body?.dominant_terpenes) ? JSON.stringify(body.dominant_terpenes) : JSON.stringify([]);
    const flavor_aroma = Array.isArray(body?.flavor_aroma) ? JSON.stringify(body.flavor_aroma) : JSON.stringify([]);
    let sort_order = body?.sort_order === void 0 || body?.sort_order === null || body?.sort_order === "" ? null : Number(body.sort_order);
    const images = cleanImagesArray(body?.images);
    const idVal = crypto.randomUUID();
    const ts = nowIso();
    try {
      const col = await env.DB.prepare("SELECT id FROM collections WHERE id=?").bind(id).first();
      if (!col) return json6({ ok: false, error: "Collection not found" }, 404);
      const existing = await env.DB.prepare("SELECT id FROM flavor_profiles WHERE slug=?").bind(slug).first();
      if (existing) return json6({ ok: false, error: "Slug already exists" }, 409);
      if (sort_order === null || Number.isNaN(sort_order)) {
        const nextRow = await env.DB.prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort FROM flavor_profiles WHERE collection_id=?"
        ).bind(id).first();
        sort_order = Number(nextRow?.next_sort ?? 0);
      }
      await env.DB.prepare(
        `INSERT INTO flavor_profiles
          (id, collection_id, slug, name, flavor_type, flavor_category, description, dominant_terpenes, flavor_aroma, mood, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      ).bind(
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
      ).run();
      if (images.length) {
        try {
          const stmt = env.DB.prepare(
            "INSERT INTO flavor_profile_images (id, profile_id, url, alt, kind, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
          );
          for (const img of images) {
            await stmt.bind(crypto.randomUUID(), idVal, img.url, img.alt, img.kind, img.sort_order).run();
          }
        } catch (e) {
          console.error("PROFILE IMAGES INSERT ERROR:", e);
        }
      }
      const created = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE id=?"
      ).bind(idVal).first();
      return json6({ ok: true, profile: created }, 201);
    } catch (err) {
      console.error("PROFILES POST ERROR:", err);
      return json6({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json6({ ok: false, error: "Method not allowed" }, 405);
}
var init_profiles = __esm({
  "api/collections/[id]/profiles.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    __name(json6, "json");
    __name(slugify, "slugify");
    __name(nowIso, "nowIso");
    __name(cleanImagesArray, "cleanImagesArray");
    __name(requireAdmin4, "requireAdmin");
    __name(onRequest2, "onRequest");
  }
});

// api/collections/[id]/sample-profiles.js
function json7(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
async function requireAdmin5(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
async function onRequest3(context) {
  const { request, env, params } = context;
  const collectionId = String(params?.id || "").trim();
  if (!collectionId) return json7({ ok: false, error: "Missing collection id" }, 400);
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
      ).bind(collectionId).all();
      return json7({ ok: true, sampleProfiles: res?.results || [] });
    } catch (err) {
      console.error("SAMPLE PROFILES GET ERROR:", err);
      return json7({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "POST") {
    const gate = await requireAdmin5(request, env);
    if (!gate.ok) return json7({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json7({ ok: false, error: "Invalid JSON" }, 400);
    }
    const profileId = String(body?.profile_id || "").trim();
    if (!profileId) return json7({ ok: false, error: "profile_id is required" }, 400);
    let sortOrder = body?.sort_order === void 0 || body?.sort_order === null || body?.sort_order === "" ? null : Number(body.sort_order);
    try {
      const collection = await env.DB.prepare("SELECT id FROM collections WHERE id=? LIMIT 1").bind(collectionId).first();
      if (!collection) return json7({ ok: false, error: "Collection not found" }, 404);
      const profile = await env.DB.prepare(
        "SELECT id, collection_id FROM flavor_profiles WHERE id=? AND is_active=1 LIMIT 1"
      ).bind(profileId).first();
      if (!profile) return json7({ ok: false, error: "Profile not found" }, 404);
      if (String(profile.collection_id) !== collectionId) {
        return json7({ ok: false, error: "Profile must belong to this collection" }, 400);
      }
      const activeCountRow = await env.DB.prepare(
        "SELECT COUNT(*) AS cnt FROM collection_sample_profiles WHERE collection_id=? AND is_active=1"
      ).bind(collectionId).first();
      const activeCount = Number(activeCountRow?.cnt || 0);
      if (activeCount >= 5) {
        return json7({ ok: false, error: "You can only select up to 5 sample profiles." }, 400);
      }
      const exists = await env.DB.prepare(
        "SELECT id FROM collection_sample_profiles WHERE collection_id=? AND profile_id=? LIMIT 1"
      ).bind(collectionId, profileId).first();
      if (exists) {
        return json7({ ok: false, error: "Profile already selected for this sample set." }, 409);
      }
      if (sortOrder === null || Number.isNaN(sortOrder)) {
        const nextRow = await env.DB.prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort FROM collection_sample_profiles WHERE collection_id=?"
        ).bind(collectionId).first();
        sortOrder = Number(nextRow?.next_sort ?? 0);
      }
      const idVal = crypto.randomUUID();
      const ts = nowIso2();
      await env.DB.prepare(
        `INSERT INTO collection_sample_profiles
          (id, collection_id, profile_id, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      ).bind(idVal, collectionId, profileId, sortOrder, ts, ts).run();
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
      ).bind(idVal).first();
      return json7({ ok: true, sampleProfile: created }, 201);
    } catch (err) {
      console.error("SAMPLE PROFILES POST ERROR:", err);
      return json7({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json7({ ok: false, error: "Method not allowed" }, 405);
}
var init_sample_profiles = __esm({
  "api/collections/[id]/sample-profiles.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    __name(json7, "json");
    __name(nowIso2, "nowIso");
    __name(requireAdmin5, "requireAdmin");
    __name(onRequest3, "onRequest");
  }
});

// api/auth/login.js
async function onRequestPost2(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email || "");
    const password = String(body.password || "");
    if (!email || !email.includes("@")) {
      return json(400, { ok: false, error: "Valid email required." });
    }
    if (!password) {
      return json(400, { ok: false, error: "Password required." });
    }
    if (!env?.DB) {
      return json(500, { ok: false, error: "D1 binding DB is missing (env.DB undefined)." });
    }
    const user = await env.DB.prepare(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first();
    if (!user) return json(401, { ok: false, error: "Invalid email or password." });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return json(401, { ok: false, error: "Invalid email or password." });
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const sessionToken = randomToken(32);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await env.DB.prepare(
      "INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)"
    ).bind(user.id, sessionToken, sessionExpiresAt, createdAt).run();
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
    setCookie(headers, SESSION_COOKIE, sessionToken, cookieOptions());
    return new Response(
      JSON.stringify({ ok: true, user: { id: user.id, email: user.email } }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}
var SESSION_COOKIE, SESSION_TTL_MS;
var init_login = __esm({
  "api/auth/login.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    SESSION_COOKIE = "el_session";
    SESSION_TTL_MS = 1e3 * 60 * 60 * 24 * 14;
    __name(onRequestPost2, "onRequestPost");
  }
});

// api/auth/logout.js
async function onRequestPost3(context) {
  const { request, env } = context;
  try {
    const cookies = parseCookie(request.headers.get("Cookie"));
    const token = cookies[SESSION_COOKIE2];
    if (token && env?.DB) {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }
  } catch (e) {
    console.error("LOGOUT ERROR:", e);
  }
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  setCookie(headers, SESSION_COOKIE2, "", cookieOptions({ maxAge: 0 }));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
var SESSION_COOKIE2;
var init_logout = __esm({
  "api/auth/logout.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    SESSION_COOKIE2 = "el_session";
    __name(onRequestPost3, "onRequestPost");
  }
});

// api/auth/me.js
async function onRequestGet2(context) {
  const cookies = parseCookie(context.request.headers.get("Cookie"));
  const token = cookies[SESSION_COOKIE3];
  const user = await getUserFromSession(context.env, token);
  return json(200, { ok: true, user: user || null });
}
var SESSION_COOKIE3;
var init_me = __esm({
  "api/auth/me.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    SESSION_COOKIE3 = "el_session";
    __name(onRequestGet2, "onRequestGet");
  }
});

// api/auth/register.js
async function onRequestPost4(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email || "");
    const password = String(body.password || "");
    if (!email || !password) {
      return json(400, { ok: false, error: "Email and password are required." });
    }
    if (password.length < 8) {
      return json(400, { ok: false, error: "Password must be at least 8 characters." });
    }
    if (!env?.DB) {
      return json(500, { ok: false, error: "D1 binding DB is missing (env.DB undefined)." });
    }
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? LIMIT 1"
    ).bind(email).first();
    if (existing?.id) {
      return json(409, { ok: false, error: "Email already registered." });
    }
    const passwordHash = await hashPassword(password);
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const insertUser = await env.DB.prepare(
      "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)"
    ).bind(email, passwordHash, createdAt).run();
    const userId = insertUser?.meta?.last_row_id;
    if (!userId) {
      return json(500, { ok: false, error: "Failed to create user (no userId returned)." });
    }
    const sessionToken = randomToken(32);
    const sessionExpiresAt = new Date(Date.now() + 1e3 * 60 * 60 * 24 * 14).toISOString();
    await env.DB.prepare(
      "INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)"
    ).bind(userId, sessionToken, sessionExpiresAt, createdAt).run();
    const headers = new Headers({ "Content-Type": "application/json" });
    setCookie(headers, "el_session", sessionToken, cookieOptions());
    return new Response(
      JSON.stringify({ ok: true, user: { id: userId, email } }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}
var init_register = __esm({
  "api/auth/register.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    __name(onRequestPost4, "onRequestPost");
  }
});

// api/images/direct-upload.js
function json8(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS4, ...extraHeaders }
  });
}
async function requireAdmin6(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
async function onRequestOptions4() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS4 } });
}
async function onRequestPost5({ request, env }) {
  const gate = await requireAdmin6(request, env);
  if (!gate.ok) return json8({ ok: false, error: gate.error }, gate.status);
  const accountId = env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) {
    return json8(
      {
        ok: false,
        error: "Missing Cloudflare Images env vars. Set CF_IMAGES_ACCOUNT_ID and CF_IMAGES_API_TOKEN in Pages settings."
      },
      500
    );
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const form = new FormData();
  if (body?.metadata) {
    try {
      form.append("metadata", JSON.stringify(body.metadata));
    } catch {
    }
  }
  form.append("requireSignedURLs", "false");
  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`
      },
      body: form
    }
  );
  const data = await cfRes.json().catch(() => null);
  if (!cfRes.ok || !data?.success) {
    console.error("CF IMAGES DIRECT UPLOAD ERROR:", cfRes.status, data);
    const msg = data?.errors?.[0]?.message || `Cloudflare Images error (${cfRes.status})`;
    return json8({ ok: false, error: msg }, 502);
  }
  return json8({ ok: true, id: data.result?.id, uploadURL: data.result?.uploadURL });
}
var CORS_HEADERS4;
var init_direct_upload = __esm({
  "api/images/direct-upload.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS4 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json8, "json");
    __name(requireAdmin6, "requireAdmin");
    __name(onRequestOptions4, "onRequestOptions");
    __name(onRequestPost5, "onRequestPost");
  }
});

// api/collections/[id].js
function json9(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS5, ...extraHeaders }
  });
}
async function requireAdmin7(request, env) {
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
async function onRequestOptions5() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS5 } });
}
async function onRequestGet3({ env, params }) {
  const id = params?.id;
  if (!id) return json9({ ok: false, error: "Missing collection id." }, 400);
  try {
    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, created_at, updated_at FROM collections WHERE id=?"
    ).bind(id).first();
    if (!row) return json9({ ok: false, error: "Collection not found." }, 404);
    return json9({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION GET ERROR:", err);
    return json9({ ok: false, error: "Server error." }, 500);
  }
}
async function onRequestPut({ request, env, params }) {
  const id = params?.id;
  if (!id) return json9({ ok: false, error: "Missing collection id." }, 400);
  const auth = await requireAdmin7(request, env);
  if (!auth.ok) return json9({ ok: false, error: auth.error }, auth.status);
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json9({ ok: false, error: "Invalid JSON body." }, 400);
  }
  const name = toText(payload.name);
  const tagline = toText(payload.tagline);
  const description = toText(payload.description);
  const badge = toText(payload.badge);
  const sortOrder = toNumber(payload.sort_order);
  const isActive = toBool01(payload.is_active);
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
  __name(add, "add");
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
  if (sets.length === 0) return json9({ ok: false, error: "No fields to update." }, 400);
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  sets.push("updated_at=?");
  binds.push(updatedAt);
  binds.push(id);
  try {
    await env.DB.prepare(`UPDATE collections SET ${sets.join(", ")} WHERE id=?`).bind(...binds).run();
    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, created_at, updated_at FROM collections WHERE id=?"
    ).bind(id).first();
    return json9({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION UPDATE ERROR:", err);
    return json9({ ok: false, error: "Server error." }, 500);
  }
}
var CORS_HEADERS5;
var init_id = __esm({
  "api/collections/[id].js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS5 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json9, "json");
    __name(requireAdmin7, "requireAdmin");
    __name(toText, "toText");
    __name(toNumber, "toNumber");
    __name(toBool01, "toBool01");
    __name(toJsonText, "toJsonText");
    __name(onRequestOptions5, "onRequestOptions");
    __name(onRequestGet3, "onRequestGet");
    __name(onRequestPut, "onRequestPut");
  }
});

// api/profiles/[slug].js
function json10(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
function nowIso3() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
async function requireAdmin8(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
function asJsonTextArray(value) {
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
function cleanImagesArray2(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x.url === "string" && x.url.trim()).map((x, idx) => ({
    url: String(x.url).trim(),
    alt: String(x.alt || "").trim(),
    kind: String(x.kind || "gallery").trim() || "gallery",
    sort_order: x.sort_order === void 0 || x.sort_order === null || x.sort_order === "" ? idx : Number(x.sort_order)
  }));
}
async function onRequest4(context) {
  const { request, env, params } = context;
  const slug = params?.slug;
  if (!slug) return json10({ ok: false, error: "Missing slug" }, 400);
  if (request.method === "GET") {
    try {
      const profile = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      if (!profile) return json10({ ok: false, error: "Not found" }, 404);
      let images = [];
      let documents = [];
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
        flavor_aroma: parseJsonArray(profile.flavor_aroma)
      };
      return json10({ ok: true, profile: normalized, images, documents });
    } catch (err) {
      console.error("PROFILE GET ERROR:", err);
      return json10({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "PUT") {
    const gate = await requireAdmin8(request, env);
    if (!gate.ok) return json10({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json10({ ok: false, error: "Invalid JSON" }, 400);
    }
    try {
      const existing = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      if (!existing) return json10({ ok: false, error: "Not found" }, 404);
      const name = body?.name !== void 0 ? String(body.name).trim() : existing.name;
      const flavor_type = body?.flavor_type !== void 0 ? String(body.flavor_type).trim() : existing.flavor_type || "";
      const flavor_category = body?.flavor_category !== void 0 ? String(body.flavor_category).trim() : existing.flavor_category || "";
      const description = body?.description !== void 0 ? String(body.description).trim() : existing.description || "";
      const mood = body?.mood !== void 0 ? String(body.mood).trim() : existing.mood || "";
      const dominant_terpenes = body?.dominant_terpenes !== void 0 ? asJsonTextArray(body.dominant_terpenes) : existing.dominant_terpenes || "[]";
      const flavor_aroma = body?.flavor_aroma !== void 0 ? asJsonTextArray(body.flavor_aroma) : existing.flavor_aroma || "[]";
      const sort_order = body?.sort_order === void 0 ? existing.sort_order : body.sort_order === null || body.sort_order === "" ? null : Number(body.sort_order);
      const is_active = body?.is_active === void 0 ? existing.is_active : body.is_active ? 1 : 0;
      const images = body?.images !== void 0 ? cleanImagesArray2(body.images) : null;
      const ts = nowIso3();
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
      ).bind(
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
      ).run();
      if (images !== null) {
        try {
          await env.DB.prepare("DELETE FROM flavor_profile_images WHERE profile_id=?").bind(existing.id).run();
          if (images.length) {
            const stmt = env.DB.prepare(
              "INSERT INTO flavor_profile_images (id, profile_id, url, alt, kind, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
            );
            for (const img of images) {
              await stmt.bind(crypto.randomUUID(), existing.id, img.url, img.alt, img.kind, img.sort_order).run();
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
        flavor_aroma: parseJsonArray(updated.flavor_aroma)
      };
      return json10({ ok: true, profile: normalized });
    } catch (err) {
      console.error("PROFILE PUT ERROR:", err);
      return json10({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json10({ ok: false, error: "Method not allowed" }, 405);
}
var init_slug = __esm({
  "api/profiles/[slug].js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    __name(json10, "json");
    __name(nowIso3, "nowIso");
    __name(requireAdmin8, "requireAdmin");
    __name(asJsonTextArray, "asJsonTextArray");
    __name(parseJsonArray, "parseJsonArray");
    __name(cleanImagesArray2, "cleanImagesArray");
    __name(onRequest4, "onRequest");
  }
});

// ../node_modules/stripe/esm/utils.js
function isOptionsHash(o) {
  return o && typeof o === "object" && OPTIONS_KEYS.some((prop) => Object.prototype.hasOwnProperty.call(o, prop));
}
function queryStringifyRequestData(data, _apiMode) {
  return stringifyRequestData(data);
}
function encodeQueryValue(value) {
  return encodeURIComponent(value).replace(/!/g, "%21").replace(/\*/g, "%2A").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/'/g, "%27").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function valueToString(value) {
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1e3).toString();
  }
  if (value === null) {
    return "";
  }
  return String(value);
}
function stringifyRequestData(data) {
  const pairs = [];
  function encode(key, value) {
    if (value === void 0) {
      return;
    }
    if (value === null || typeof value !== "object" || value instanceof Date) {
      pairs.push(encodeQueryValue(key) + "=" + encodeQueryValue(valueToString(value)));
      return;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== void 0) {
          encode(key + "[" + i + "]", value[i]);
        }
      }
      return;
    }
    for (const k of Object.keys(value)) {
      encode(key + "[" + k + "]", value[k]);
    }
  }
  __name(encode, "encode");
  if (typeof data === "object" && data !== null) {
    for (const key of Object.keys(data)) {
      encode(key, data[key]);
    }
  }
  return pairs.join("&");
}
function isValidEncodeUriComponentType(value) {
  return ["number", "string", "boolean"].includes(typeof value);
}
function extractUrlParams(path) {
  const params = path.match(/\{\w+\}/g);
  if (!params) {
    return [];
  }
  return params.map((param) => param.replace(/[{}]/g, ""));
}
function getDataFromArgs(args) {
  if (!Array.isArray(args) || !args[0] || typeof args[0] !== "object") {
    return {};
  }
  if (!isOptionsHash(args[0])) {
    return args.shift();
  }
  const argKeys = Object.keys(args[0]);
  const optionKeysInArgs = argKeys.filter((key) => OPTIONS_KEYS.includes(key));
  if (optionKeysInArgs.length > 0 && optionKeysInArgs.length !== argKeys.length) {
    emitWarning(`Options found in arguments (${optionKeysInArgs.join(", ")}). Did you mean to pass an options object? See https://github.com/stripe/stripe-node/wiki/Passing-Options.`);
  }
  return {};
}
function getOptionsFromArgs(args) {
  const opts = {
    host: null,
    headers: {},
    settings: {},
    streaming: false
  };
  if (args.length > 0) {
    const arg = args[args.length - 1];
    if (typeof arg === "string") {
      opts.authenticator = createApiKeyAuthenticator(args.pop());
    } else if (isOptionsHash(arg)) {
      const params = Object.assign({}, args.pop());
      const extraKeys = Object.keys(params).filter((key) => !OPTIONS_KEYS.includes(key));
      if (extraKeys.length) {
        emitWarning(`Invalid options found (${extraKeys.join(", ")}); ignoring.`);
      }
      if (params.apiKey) {
        opts.authenticator = createApiKeyAuthenticator(params.apiKey);
      }
      if (params.idempotencyKey) {
        opts.headers["Idempotency-Key"] = params.idempotencyKey;
      }
      if (params.stripeAccount) {
        opts.headers["Stripe-Account"] = params.stripeAccount;
      }
      if (params.stripeContext) {
        if (opts.headers["Stripe-Account"]) {
          throw new Error("Can't specify both stripeAccount and stripeContext.");
        }
        opts.headers["Stripe-Context"] = params.stripeContext;
      }
      if (params.apiVersion) {
        opts.headers["Stripe-Version"] = params.apiVersion;
      }
      if (Number.isInteger(params.maxNetworkRetries)) {
        opts.settings.maxNetworkRetries = params.maxNetworkRetries;
      }
      if (Number.isInteger(params.timeout)) {
        opts.settings.timeout = params.timeout;
      }
      if (params.host) {
        opts.host = params.host;
      }
      if (params.authenticator) {
        if (params.apiKey) {
          throw new Error("Can't specify both apiKey and authenticator.");
        }
        if (typeof params.authenticator !== "function") {
          throw new Error("The authenticator must be a function receiving a request as the first parameter.");
        }
        opts.authenticator = params.authenticator;
      }
      if (params.additionalHeaders) {
        opts.headers = params.additionalHeaders;
      }
      if (params.streaming) {
        opts.streaming = true;
      }
    }
  }
  return opts;
}
function protoExtend(sub) {
  const Super = this;
  const Constructor = Object.prototype.hasOwnProperty.call(sub, "constructor") ? sub.constructor : function(...args) {
    Super.apply(this, args);
  };
  Object.assign(Constructor, Super);
  Constructor.prototype = Object.create(Super.prototype);
  Object.assign(Constructor.prototype, sub);
  return Constructor;
}
function removeNullish(obj) {
  if (typeof obj !== "object") {
    throw new Error("Argument must be an object");
  }
  return Object.keys(obj).reduce((result, key) => {
    if (obj[key] != null) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}
function normalizeHeaders(obj) {
  if (!(obj && typeof obj === "object")) {
    return obj;
  }
  return Object.keys(obj).reduce((result, header) => {
    result[normalizeHeader(header)] = obj[header];
    return result;
  }, {});
}
function normalizeHeader(header) {
  return header.split("-").map((text) => text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()).join("-");
}
function callbackifyPromiseWithTimeout(promise, callback) {
  if (callback) {
    return promise.then((res) => {
      setTimeout(() => {
        callback(null, res);
      }, 0);
    }, (err) => {
      setTimeout(() => {
        callback(err, null);
      }, 0);
    });
  }
  return promise;
}
function pascalToCamelCase(name) {
  if (name === "OAuth") {
    return "oauth";
  } else {
    return name[0].toLowerCase() + name.substring(1);
  }
}
function emitWarning(warning) {
  if (typeof process.emitWarning !== "function") {
    return console.warn(`Stripe: ${warning}`);
  }
  return process.emitWarning(warning, "Stripe");
}
function isObject(obj) {
  const type = typeof obj;
  return (type === "function" || type === "object") && !!obj;
}
function flattenAndStringify(data) {
  const result = {};
  const step = /* @__PURE__ */ __name((obj, prevKey) => {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prevKey ? `${prevKey}[${key}]` : key;
      if (isObject(value)) {
        if (!(value instanceof Uint8Array) && !Object.prototype.hasOwnProperty.call(value, "data")) {
          return step(value, newKey);
        } else {
          result[newKey] = value;
        }
      } else {
        result[newKey] = String(value);
      }
    });
  }, "step");
  step(data, null);
  return result;
}
function validateInteger(name, n, defaultVal) {
  if (!Number.isInteger(n)) {
    if (defaultVal !== void 0) {
      return defaultVal;
    } else {
      throw new Error(`${name} must be an integer`);
    }
  }
  return n;
}
function determineProcessUserAgentProperties() {
  return typeof process === "undefined" ? {} : {
    lang_version: process.version,
    platform: process.platform
  };
}
function createApiKeyAuthenticator(apiKey) {
  const authenticator = /* @__PURE__ */ __name((request) => {
    request.headers.Authorization = "Bearer " + apiKey;
    return Promise.resolve();
  }, "authenticator");
  authenticator._apiKey = apiKey;
  return authenticator;
}
function dateTimeReplacer(key, value) {
  if (this[key] instanceof Date) {
    return Math.floor(this[key].getTime() / 1e3).toString();
  }
  return value;
}
function jsonStringifyRequestData(data) {
  return JSON.stringify(data, dateTimeReplacer);
}
function getAPIMode(path) {
  if (!path) {
    return "v1";
  }
  return path.startsWith("/v2") ? "v2" : "v1";
}
function parseHttpHeaderAsString(header) {
  if (Array.isArray(header)) {
    return header.join(", ");
  }
  return String(header);
}
function parseHttpHeaderAsNumber(header) {
  const number = Array.isArray(header) ? header[0] : header;
  return Number(number);
}
function parseHeadersForFetch(headers) {
  return Object.entries(headers).map(([key, value]) => {
    return [key, parseHttpHeaderAsString(value)];
  });
}
var OPTIONS_KEYS, makeURLInterpolator;
var init_utils = __esm({
  "../node_modules/stripe/esm/utils.js"() {
    init_functionsRoutes_0_7157080303585999();
    OPTIONS_KEYS = [
      "apiKey",
      "idempotencyKey",
      "stripeAccount",
      "apiVersion",
      "maxNetworkRetries",
      "timeout",
      "host",
      "authenticator",
      "stripeContext",
      "additionalHeaders",
      "streaming"
    ];
    __name(isOptionsHash, "isOptionsHash");
    __name(queryStringifyRequestData, "queryStringifyRequestData");
    __name(encodeQueryValue, "encodeQueryValue");
    __name(valueToString, "valueToString");
    __name(stringifyRequestData, "stringifyRequestData");
    makeURLInterpolator = /* @__PURE__ */ (() => {
      const rc = {
        "\n": "\\n",
        '"': '\\"',
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
      };
      return (str) => {
        const cleanString = str.replace(/["\n\r\u2028\u2029]/g, ($0) => rc[$0]);
        return (outputs) => {
          return cleanString.replace(/\{([\s\S]+?)\}/g, ($0, $1) => {
            const output = outputs[$1];
            if (isValidEncodeUriComponentType(output))
              return encodeURIComponent(output);
            return "";
          });
        };
      };
    })();
    __name(isValidEncodeUriComponentType, "isValidEncodeUriComponentType");
    __name(extractUrlParams, "extractUrlParams");
    __name(getDataFromArgs, "getDataFromArgs");
    __name(getOptionsFromArgs, "getOptionsFromArgs");
    __name(protoExtend, "protoExtend");
    __name(removeNullish, "removeNullish");
    __name(normalizeHeaders, "normalizeHeaders");
    __name(normalizeHeader, "normalizeHeader");
    __name(callbackifyPromiseWithTimeout, "callbackifyPromiseWithTimeout");
    __name(pascalToCamelCase, "pascalToCamelCase");
    __name(emitWarning, "emitWarning");
    __name(isObject, "isObject");
    __name(flattenAndStringify, "flattenAndStringify");
    __name(validateInteger, "validateInteger");
    __name(determineProcessUserAgentProperties, "determineProcessUserAgentProperties");
    __name(createApiKeyAuthenticator, "createApiKeyAuthenticator");
    __name(dateTimeReplacer, "dateTimeReplacer");
    __name(jsonStringifyRequestData, "jsonStringifyRequestData");
    __name(getAPIMode, "getAPIMode");
    __name(parseHttpHeaderAsString, "parseHttpHeaderAsString");
    __name(parseHttpHeaderAsNumber, "parseHttpHeaderAsNumber");
    __name(parseHeadersForFetch, "parseHeadersForFetch");
  }
});

// ../node_modules/stripe/esm/net/HttpClient.js
var HttpClient, HttpClientResponse;
var init_HttpClient = __esm({
  "../node_modules/stripe/esm/net/HttpClient.js"() {
    init_functionsRoutes_0_7157080303585999();
    HttpClient = class _HttpClient {
      static {
        __name(this, "HttpClient");
      }
      /** The client name used for diagnostics. */
      getClientName() {
        throw new Error("getClientName not implemented.");
      }
      makeRequest(host, port, path, method, headers, requestData, protocol, timeout) {
        throw new Error("makeRequest not implemented.");
      }
      /** Helper to make a consistent timeout error across implementations. */
      static makeTimeoutError() {
        const timeoutErr = new TypeError(_HttpClient.TIMEOUT_ERROR_CODE);
        timeoutErr.code = _HttpClient.TIMEOUT_ERROR_CODE;
        return timeoutErr;
      }
    };
    HttpClient.CONNECTION_CLOSED_ERROR_CODES = ["ECONNRESET", "EPIPE"];
    HttpClient.TIMEOUT_ERROR_CODE = "ETIMEDOUT";
    HttpClientResponse = class {
      static {
        __name(this, "HttpClientResponse");
      }
      constructor(statusCode, headers) {
        this._statusCode = statusCode;
        this._headers = headers;
      }
      getStatusCode() {
        return this._statusCode;
      }
      getHeaders() {
        return this._headers;
      }
      getRawResponse() {
        throw new Error("getRawResponse not implemented.");
      }
      toStream(streamCompleteCallback) {
        throw new Error("toStream not implemented.");
      }
      toJSON() {
        throw new Error("toJSON not implemented.");
      }
    };
  }
});

// ../node_modules/stripe/esm/net/FetchHttpClient.js
var FetchHttpClient, FetchHttpClientResponse;
var init_FetchHttpClient = __esm({
  "../node_modules/stripe/esm/net/FetchHttpClient.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_utils();
    init_HttpClient();
    FetchHttpClient = class _FetchHttpClient extends HttpClient {
      static {
        __name(this, "FetchHttpClient");
      }
      constructor(fetchFn) {
        super();
        if (!fetchFn) {
          if (!globalThis.fetch) {
            throw new Error("fetch() function not provided and is not defined in the global scope. You must provide a fetch implementation.");
          }
          fetchFn = globalThis.fetch;
        }
        if (globalThis.AbortController) {
          this._fetchFn = _FetchHttpClient.makeFetchWithAbortTimeout(fetchFn);
        } else {
          this._fetchFn = _FetchHttpClient.makeFetchWithRaceTimeout(fetchFn);
        }
      }
      static makeFetchWithRaceTimeout(fetchFn) {
        return (url, init, timeout) => {
          let pendingTimeoutId;
          const timeoutPromise = new Promise((_, reject) => {
            pendingTimeoutId = setTimeout(() => {
              pendingTimeoutId = null;
              reject(HttpClient.makeTimeoutError());
            }, timeout);
          });
          const fetchPromise = fetchFn(url, init);
          return Promise.race([fetchPromise, timeoutPromise]).finally(() => {
            if (pendingTimeoutId) {
              clearTimeout(pendingTimeoutId);
            }
          });
        };
      }
      static makeFetchWithAbortTimeout(fetchFn) {
        return async (url, init, timeout) => {
          const abort = new AbortController();
          let timeoutId = setTimeout(() => {
            timeoutId = null;
            abort.abort(HttpClient.makeTimeoutError());
          }, timeout);
          try {
            return await fetchFn(url, Object.assign(Object.assign({}, init), { signal: abort.signal }));
          } catch (err) {
            if (err.name === "AbortError") {
              throw HttpClient.makeTimeoutError();
            } else {
              throw err;
            }
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        };
      }
      /** @override. */
      getClientName() {
        return "fetch";
      }
      async makeRequest(host, port, path, method, headers, requestData, protocol, timeout) {
        const isInsecureConnection = protocol === "http";
        const url = new URL(path, `${isInsecureConnection ? "http" : "https"}://${host}`);
        url.port = port;
        const methodHasPayload = method == "POST" || method == "PUT" || method == "PATCH";
        const body = requestData || (methodHasPayload ? "" : void 0);
        const res = await this._fetchFn(url.toString(), {
          method,
          headers: parseHeadersForFetch(headers),
          body
        }, timeout);
        return new FetchHttpClientResponse(res);
      }
    };
    FetchHttpClientResponse = class _FetchHttpClientResponse extends HttpClientResponse {
      static {
        __name(this, "FetchHttpClientResponse");
      }
      constructor(res) {
        super(res.status, _FetchHttpClientResponse._transformHeadersToObject(res.headers));
        this._res = res;
      }
      getRawResponse() {
        return this._res;
      }
      toStream(streamCompleteCallback) {
        streamCompleteCallback();
        return this._res.body;
      }
      toJSON() {
        return this._res.json();
      }
      static _transformHeadersToObject(headers) {
        const headersObj = {};
        for (const entry of headers) {
          if (!Array.isArray(entry) || entry.length != 2) {
            throw new Error("Response objects produced by the fetch function given to FetchHttpClient do not have an iterable headers map. Response#headers should be an iterable object.");
          }
          headersObj[entry[0]] = entry[1];
        }
        return headersObj;
      }
    };
  }
});

// ../node_modules/stripe/esm/crypto/CryptoProvider.js
var CryptoProvider, CryptoProviderOnlySupportsAsyncError;
var init_CryptoProvider = __esm({
  "../node_modules/stripe/esm/crypto/CryptoProvider.js"() {
    init_functionsRoutes_0_7157080303585999();
    CryptoProvider = class {
      static {
        __name(this, "CryptoProvider");
      }
      /**
       * Computes a SHA-256 HMAC given a secret and a payload (encoded in UTF-8).
       * The output HMAC should be encoded in hexadecimal.
       *
       * Sample values for implementations:
       * - computeHMACSignature('', 'test_secret') => 'f7f9bd47fb987337b5796fdc1fdb9ba221d0d5396814bfcaf9521f43fd8927fd'
       * - computeHMACSignature('\ud83d\ude00', 'test_secret') => '837da296d05c4fe31f61d5d7ead035099d9585a5bcde87de952012a78f0b0c43
       */
      computeHMACSignature(payload, secret) {
        throw new Error("computeHMACSignature not implemented.");
      }
      /**
       * Asynchronous version of `computeHMACSignature`. Some implementations may
       * only allow support async signature computation.
       *
       * Computes a SHA-256 HMAC given a secret and a payload (encoded in UTF-8).
       * The output HMAC should be encoded in hexadecimal.
       *
       * Sample values for implementations:
       * - computeHMACSignature('', 'test_secret') => 'f7f9bd47fb987337b5796fdc1fdb9ba221d0d5396814bfcaf9521f43fd8927fd'
       * - computeHMACSignature('\ud83d\ude00', 'test_secret') => '837da296d05c4fe31f61d5d7ead035099d9585a5bcde87de952012a78f0b0c43
       */
      computeHMACSignatureAsync(payload, secret) {
        throw new Error("computeHMACSignatureAsync not implemented.");
      }
      /**
       * Computes a SHA-256 hash of the data.
       */
      computeSHA256Async(data) {
        throw new Error("computeSHA256 not implemented.");
      }
    };
    CryptoProviderOnlySupportsAsyncError = class extends Error {
      static {
        __name(this, "CryptoProviderOnlySupportsAsyncError");
      }
    };
  }
});

// ../node_modules/stripe/esm/crypto/SubtleCryptoProvider.js
var SubtleCryptoProvider, byteHexMapping;
var init_SubtleCryptoProvider = __esm({
  "../node_modules/stripe/esm/crypto/SubtleCryptoProvider.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_CryptoProvider();
    SubtleCryptoProvider = class extends CryptoProvider {
      static {
        __name(this, "SubtleCryptoProvider");
      }
      constructor(subtleCrypto) {
        super();
        this.subtleCrypto = subtleCrypto || crypto.subtle;
      }
      /** @override */
      computeHMACSignature(payload, secret) {
        throw new CryptoProviderOnlySupportsAsyncError("SubtleCryptoProvider cannot be used in a synchronous context.");
      }
      /** @override */
      async computeHMACSignatureAsync(payload, secret) {
        const encoder2 = new TextEncoder();
        const key = await this.subtleCrypto.importKey("raw", encoder2.encode(secret), {
          name: "HMAC",
          hash: { name: "SHA-256" }
        }, false, ["sign"]);
        const signatureBuffer = await this.subtleCrypto.sign("hmac", key, encoder2.encode(payload));
        const signatureBytes = new Uint8Array(signatureBuffer);
        const signatureHexCodes = new Array(signatureBytes.length);
        for (let i = 0; i < signatureBytes.length; i++) {
          signatureHexCodes[i] = byteHexMapping[signatureBytes[i]];
        }
        return signatureHexCodes.join("");
      }
      /** @override */
      async computeSHA256Async(data) {
        return new Uint8Array(await this.subtleCrypto.digest("SHA-256", data));
      }
    };
    byteHexMapping = new Array(256);
    for (let i = 0; i < byteHexMapping.length; i++) {
      byteHexMapping[i] = i.toString(16).padStart(2, "0");
    }
  }
});

// ../node_modules/stripe/esm/platform/PlatformFunctions.js
var PlatformFunctions;
var init_PlatformFunctions = __esm({
  "../node_modules/stripe/esm/platform/PlatformFunctions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_FetchHttpClient();
    init_SubtleCryptoProvider();
    PlatformFunctions = class {
      static {
        __name(this, "PlatformFunctions");
      }
      constructor() {
        this._fetchFn = null;
        this._agent = null;
      }
      /**
       * Gets uname with Node's built-in `exec` function, if available.
       */
      getUname() {
        throw new Error("getUname not implemented.");
      }
      /**
       * Generates a v4 UUID. See https://stackoverflow.com/a/2117523
       */
      uuid4() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === "x" ? r : r & 3 | 8;
          return v.toString(16);
        });
      }
      /**
       * Compares strings in constant time.
       */
      secureCompare(a, b) {
        if (a.length !== b.length) {
          return false;
        }
        const len = a.length;
        let result = 0;
        for (let i = 0; i < len; ++i) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
      }
      /**
       * Creates an event emitter.
       */
      createEmitter() {
        throw new Error("createEmitter not implemented.");
      }
      /**
       * Checks if the request data is a stream. If so, read the entire stream
       * to a buffer and return the buffer.
       */
      tryBufferData(data) {
        throw new Error("tryBufferData not implemented.");
      }
      /**
       * Creates an HTTP client which uses the Node `http` and `https` packages
       * to issue requests.
       */
      createNodeHttpClient(agent) {
        throw new Error("createNodeHttpClient not implemented.");
      }
      /**
       * Creates an HTTP client for issuing Stripe API requests which uses the Web
       * Fetch API.
       *
       * A fetch function can optionally be passed in as a parameter. If none is
       * passed, will default to the default `fetch` function in the global scope.
       */
      createFetchHttpClient(fetchFn) {
        return new FetchHttpClient(fetchFn);
      }
      /**
       * Creates an HTTP client using runtime-specific APIs.
       */
      createDefaultHttpClient() {
        throw new Error("createDefaultHttpClient not implemented.");
      }
      /**
       * Creates a CryptoProvider which uses the Node `crypto` package for its computations.
       */
      createNodeCryptoProvider() {
        throw new Error("createNodeCryptoProvider not implemented.");
      }
      /**
       * Creates a CryptoProvider which uses the SubtleCrypto interface of the Web Crypto API.
       */
      createSubtleCryptoProvider(subtleCrypto) {
        return new SubtleCryptoProvider(subtleCrypto);
      }
      createDefaultCryptoProvider() {
        throw new Error("createDefaultCryptoProvider not implemented.");
      }
    };
  }
});

// ../node_modules/stripe/esm/StripeEmitter.js
var _StripeEvent, StripeEmitter;
var init_StripeEmitter = __esm({
  "../node_modules/stripe/esm/StripeEmitter.js"() {
    init_functionsRoutes_0_7157080303585999();
    _StripeEvent = class extends Event {
      static {
        __name(this, "_StripeEvent");
      }
      constructor(eventName, data) {
        super(eventName);
        this.data = data;
      }
    };
    StripeEmitter = class {
      static {
        __name(this, "StripeEmitter");
      }
      constructor() {
        this.eventTarget = new EventTarget();
        this.listenerMapping = /* @__PURE__ */ new Map();
      }
      on(eventName, listener) {
        const listenerWrapper = /* @__PURE__ */ __name((event) => {
          listener(event.data);
        }, "listenerWrapper");
        this.listenerMapping.set(listener, listenerWrapper);
        return this.eventTarget.addEventListener(eventName, listenerWrapper);
      }
      removeListener(eventName, listener) {
        const listenerWrapper = this.listenerMapping.get(listener);
        this.listenerMapping.delete(listener);
        return this.eventTarget.removeEventListener(eventName, listenerWrapper);
      }
      once(eventName, listener) {
        const listenerWrapper = /* @__PURE__ */ __name((event) => {
          listener(event.data);
        }, "listenerWrapper");
        this.listenerMapping.set(listener, listenerWrapper);
        return this.eventTarget.addEventListener(eventName, listenerWrapper, {
          once: true
        });
      }
      emit(eventName, data) {
        return this.eventTarget.dispatchEvent(new _StripeEvent(eventName, data));
      }
    };
  }
});

// ../node_modules/stripe/esm/platform/WebPlatformFunctions.js
var WebPlatformFunctions;
var init_WebPlatformFunctions = __esm({
  "../node_modules/stripe/esm/platform/WebPlatformFunctions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_PlatformFunctions();
    init_StripeEmitter();
    WebPlatformFunctions = class extends PlatformFunctions {
      static {
        __name(this, "WebPlatformFunctions");
      }
      /** @override */
      getUname() {
        return Promise.resolve(null);
      }
      /** @override */
      createEmitter() {
        return new StripeEmitter();
      }
      /** @override */
      tryBufferData(data) {
        if (data.file.data instanceof ReadableStream) {
          throw new Error("Uploading a file as a stream is not supported in non-Node environments. Please open or upvote an issue at github.com/stripe/stripe-node if you use this, detailing your use-case.");
        }
        return Promise.resolve(data);
      }
      /** @override */
      createNodeHttpClient() {
        throw new Error("Stripe: `createNodeHttpClient()` is not available in non-Node environments. Please use `createFetchHttpClient()` instead.");
      }
      /** @override */
      createDefaultHttpClient() {
        return super.createFetchHttpClient();
      }
      /** @override */
      createNodeCryptoProvider() {
        throw new Error("Stripe: `createNodeCryptoProvider()` is not available in non-Node environments. Please use `createSubtleCryptoProvider()` instead.");
      }
      /** @override */
      createDefaultCryptoProvider() {
        return this.createSubtleCryptoProvider();
      }
    };
  }
});

// ../node_modules/stripe/esm/Error.js
var Error_exports = {};
__export(Error_exports, {
  StripeAPIError: () => StripeAPIError,
  StripeAuthenticationError: () => StripeAuthenticationError,
  StripeCardError: () => StripeCardError,
  StripeConnectionError: () => StripeConnectionError,
  StripeError: () => StripeError,
  StripeIdempotencyError: () => StripeIdempotencyError,
  StripeInvalidGrantError: () => StripeInvalidGrantError,
  StripeInvalidRequestError: () => StripeInvalidRequestError,
  StripePermissionError: () => StripePermissionError,
  StripeRateLimitError: () => StripeRateLimitError,
  StripeSignatureVerificationError: () => StripeSignatureVerificationError,
  StripeUnknownError: () => StripeUnknownError,
  TemporarySessionExpiredError: () => TemporarySessionExpiredError,
  generateV1Error: () => generateV1Error,
  generateV2Error: () => generateV2Error
});
var generateV1Error, generateV2Error, StripeError, StripeCardError, StripeInvalidRequestError, StripeAPIError, StripeAuthenticationError, StripePermissionError, StripeRateLimitError, StripeConnectionError, StripeSignatureVerificationError, StripeIdempotencyError, StripeInvalidGrantError, StripeUnknownError, TemporarySessionExpiredError;
var init_Error = __esm({
  "../node_modules/stripe/esm/Error.js"() {
    init_functionsRoutes_0_7157080303585999();
    generateV1Error = /* @__PURE__ */ __name((rawStripeError) => {
      switch (rawStripeError.type) {
        case "card_error":
          return new StripeCardError(rawStripeError);
        case "invalid_request_error":
          return new StripeInvalidRequestError(rawStripeError);
        case "api_error":
          return new StripeAPIError(rawStripeError);
        case "authentication_error":
          return new StripeAuthenticationError(rawStripeError);
        case "rate_limit_error":
          return new StripeRateLimitError(rawStripeError);
        case "idempotency_error":
          return new StripeIdempotencyError(rawStripeError);
        case "invalid_grant":
          return new StripeInvalidGrantError(rawStripeError);
        default:
          return new StripeUnknownError(rawStripeError);
      }
    }, "generateV1Error");
    generateV2Error = /* @__PURE__ */ __name((rawStripeError) => {
      switch (rawStripeError.type) {
        // switchCases: The beginning of the section generated from our OpenAPI spec
        case "temporary_session_expired":
          return new TemporarySessionExpiredError(rawStripeError);
      }
      switch (rawStripeError.code) {
        case "invalid_fields":
          return new StripeInvalidRequestError(rawStripeError);
      }
      return generateV1Error(rawStripeError);
    }, "generateV2Error");
    StripeError = class extends Error {
      static {
        __name(this, "StripeError");
      }
      constructor(raw = {}, type = null) {
        var _a;
        super(raw.message);
        this.type = type || this.constructor.name;
        this.raw = raw;
        this.rawType = raw.type;
        this.code = raw.code;
        this.doc_url = raw.doc_url;
        this.param = raw.param;
        this.detail = raw.detail;
        this.headers = raw.headers;
        this.requestId = raw.requestId;
        this.statusCode = raw.statusCode;
        this.message = (_a = raw.message) !== null && _a !== void 0 ? _a : "";
        this.userMessage = raw.user_message;
        this.charge = raw.charge;
        this.decline_code = raw.decline_code;
        this.payment_intent = raw.payment_intent;
        this.payment_method = raw.payment_method;
        this.payment_method_type = raw.payment_method_type;
        this.setup_intent = raw.setup_intent;
        this.source = raw.source;
      }
    };
    StripeError.generate = generateV1Error;
    StripeCardError = class extends StripeError {
      static {
        __name(this, "StripeCardError");
      }
      constructor(raw = {}) {
        super(raw, "StripeCardError");
      }
    };
    StripeInvalidRequestError = class extends StripeError {
      static {
        __name(this, "StripeInvalidRequestError");
      }
      constructor(raw = {}) {
        super(raw, "StripeInvalidRequestError");
      }
    };
    StripeAPIError = class extends StripeError {
      static {
        __name(this, "StripeAPIError");
      }
      constructor(raw = {}) {
        super(raw, "StripeAPIError");
      }
    };
    StripeAuthenticationError = class extends StripeError {
      static {
        __name(this, "StripeAuthenticationError");
      }
      constructor(raw = {}) {
        super(raw, "StripeAuthenticationError");
      }
    };
    StripePermissionError = class extends StripeError {
      static {
        __name(this, "StripePermissionError");
      }
      constructor(raw = {}) {
        super(raw, "StripePermissionError");
      }
    };
    StripeRateLimitError = class extends StripeError {
      static {
        __name(this, "StripeRateLimitError");
      }
      constructor(raw = {}) {
        super(raw, "StripeRateLimitError");
      }
    };
    StripeConnectionError = class extends StripeError {
      static {
        __name(this, "StripeConnectionError");
      }
      constructor(raw = {}) {
        super(raw, "StripeConnectionError");
      }
    };
    StripeSignatureVerificationError = class extends StripeError {
      static {
        __name(this, "StripeSignatureVerificationError");
      }
      constructor(header, payload, raw = {}) {
        super(raw, "StripeSignatureVerificationError");
        this.header = header;
        this.payload = payload;
      }
    };
    StripeIdempotencyError = class extends StripeError {
      static {
        __name(this, "StripeIdempotencyError");
      }
      constructor(raw = {}) {
        super(raw, "StripeIdempotencyError");
      }
    };
    StripeInvalidGrantError = class extends StripeError {
      static {
        __name(this, "StripeInvalidGrantError");
      }
      constructor(raw = {}) {
        super(raw, "StripeInvalidGrantError");
      }
    };
    StripeUnknownError = class extends StripeError {
      static {
        __name(this, "StripeUnknownError");
      }
      constructor(raw = {}) {
        super(raw, "StripeUnknownError");
      }
    };
    TemporarySessionExpiredError = class extends StripeError {
      static {
        __name(this, "TemporarySessionExpiredError");
      }
      constructor(rawStripeError = {}) {
        super(rawStripeError, "TemporarySessionExpiredError");
      }
    };
  }
});

// ../node_modules/stripe/esm/RequestSender.js
var MAX_RETRY_AFTER_WAIT, RequestSender;
var init_RequestSender = __esm({
  "../node_modules/stripe/esm/RequestSender.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_Error();
    init_HttpClient();
    init_utils();
    MAX_RETRY_AFTER_WAIT = 60;
    RequestSender = class _RequestSender {
      static {
        __name(this, "RequestSender");
      }
      constructor(stripe, maxBufferedRequestMetric) {
        this._stripe = stripe;
        this._maxBufferedRequestMetric = maxBufferedRequestMetric;
      }
      _normalizeStripeContext(optsContext, clientContext) {
        if (optsContext) {
          return optsContext.toString() || null;
        }
        return (clientContext === null || clientContext === void 0 ? void 0 : clientContext.toString()) || null;
      }
      _addHeadersDirectlyToObject(obj, headers) {
        obj.requestId = headers["request-id"];
        obj.stripeAccount = obj.stripeAccount || headers["stripe-account"];
        obj.apiVersion = obj.apiVersion || headers["stripe-version"];
        obj.idempotencyKey = obj.idempotencyKey || headers["idempotency-key"];
      }
      _makeResponseEvent(requestEvent, statusCode, headers) {
        const requestEndTime = Date.now();
        const requestDurationMs = requestEndTime - requestEvent.request_start_time;
        return removeNullish({
          api_version: headers["stripe-version"],
          account: headers["stripe-account"],
          idempotency_key: headers["idempotency-key"],
          method: requestEvent.method,
          path: requestEvent.path,
          status: statusCode,
          request_id: this._getRequestId(headers),
          elapsed: requestDurationMs,
          request_start_time: requestEvent.request_start_time,
          request_end_time: requestEndTime
        });
      }
      _getRequestId(headers) {
        return headers["request-id"];
      }
      /**
       * Used by methods with spec.streaming === true. For these methods, we do not
       * buffer successful responses into memory or do parse them into stripe
       * objects, we delegate that all of that to the user and pass back the raw
       * http.Response object to the callback.
       *
       * (Unsuccessful responses shouldn't make it here, they should
       * still be buffered/parsed and handled by _jsonResponseHandler -- see
       * makeRequest)
       */
      _streamingResponseHandler(requestEvent, usage, callback) {
        return (res) => {
          const headers = res.getHeaders();
          const streamCompleteCallback = /* @__PURE__ */ __name(() => {
            const responseEvent = this._makeResponseEvent(requestEvent, res.getStatusCode(), headers);
            this._stripe._emitter.emit("response", responseEvent);
            this._recordRequestMetrics(this._getRequestId(headers), responseEvent.elapsed, usage);
          }, "streamCompleteCallback");
          const stream = res.toStream(streamCompleteCallback);
          this._addHeadersDirectlyToObject(stream, headers);
          return callback(null, stream);
        };
      }
      /**
       * Default handler for Stripe responses. Buffers the response into memory,
       * parses the JSON and returns it (i.e. passes it to the callback) if there
       * is no "error" field. Otherwise constructs/passes an appropriate Error.
       */
      _jsonResponseHandler(requestEvent, apiMode, usage, callback) {
        return (res) => {
          const headers = res.getHeaders();
          const requestId = this._getRequestId(headers);
          const statusCode = res.getStatusCode();
          const responseEvent = this._makeResponseEvent(requestEvent, statusCode, headers);
          this._stripe._emitter.emit("response", responseEvent);
          res.toJSON().then((jsonResponse) => {
            if (jsonResponse.error) {
              let err;
              if (typeof jsonResponse.error === "string") {
                jsonResponse.error = {
                  type: jsonResponse.error,
                  message: jsonResponse.error_description
                };
              }
              jsonResponse.error.headers = headers;
              jsonResponse.error.statusCode = statusCode;
              jsonResponse.error.requestId = requestId;
              if (statusCode === 401) {
                err = new StripeAuthenticationError(jsonResponse.error);
              } else if (statusCode === 403) {
                err = new StripePermissionError(jsonResponse.error);
              } else if (statusCode === 429) {
                err = new StripeRateLimitError(jsonResponse.error);
              } else if (apiMode === "v2") {
                err = generateV2Error(jsonResponse.error);
              } else {
                err = generateV1Error(jsonResponse.error);
              }
              throw err;
            }
            return jsonResponse;
          }, (e) => {
            throw new StripeAPIError({
              message: "Invalid JSON received from the Stripe API",
              exception: e,
              requestId: headers["request-id"]
            });
          }).then((jsonResponse) => {
            this._recordRequestMetrics(requestId, responseEvent.elapsed, usage);
            const rawResponse = res.getRawResponse();
            this._addHeadersDirectlyToObject(rawResponse, headers);
            Object.defineProperty(jsonResponse, "lastResponse", {
              enumerable: false,
              writable: false,
              value: rawResponse
            });
            callback(null, jsonResponse);
          }, (e) => callback(e, null));
        };
      }
      static _generateConnectionErrorMessage(requestRetries) {
        return `An error occurred with our connection to Stripe.${requestRetries > 0 ? ` Request was retried ${requestRetries} times.` : ""}`;
      }
      // For more on when and how to retry API requests, see https://stripe.com/docs/error-handling#safely-retrying-requests-with-idempotency
      static _shouldRetry(res, numRetries, maxRetries, error) {
        if (error && numRetries === 0 && HttpClient.CONNECTION_CLOSED_ERROR_CODES.includes(error.code)) {
          return true;
        }
        if (numRetries >= maxRetries) {
          return false;
        }
        if (!res) {
          return true;
        }
        if (res.getHeaders()["stripe-should-retry"] === "false") {
          return false;
        }
        if (res.getHeaders()["stripe-should-retry"] === "true") {
          return true;
        }
        if (res.getStatusCode() === 409) {
          return true;
        }
        if (res.getStatusCode() >= 500) {
          return true;
        }
        return false;
      }
      _getSleepTimeInMS(numRetries, retryAfter = null) {
        const initialNetworkRetryDelay = this._stripe.getInitialNetworkRetryDelay();
        const maxNetworkRetryDelay = this._stripe.getMaxNetworkRetryDelay();
        let sleepSeconds = Math.min(initialNetworkRetryDelay * Math.pow(2, numRetries - 1), maxNetworkRetryDelay);
        sleepSeconds *= 0.5 * (1 + Math.random());
        sleepSeconds = Math.max(initialNetworkRetryDelay, sleepSeconds);
        if (Number.isInteger(retryAfter) && retryAfter <= MAX_RETRY_AFTER_WAIT) {
          sleepSeconds = Math.max(sleepSeconds, retryAfter);
        }
        return sleepSeconds * 1e3;
      }
      // Max retries can be set on a per request basis. Favor those over the global setting
      _getMaxNetworkRetries(settings = {}) {
        return settings.maxNetworkRetries !== void 0 && Number.isInteger(settings.maxNetworkRetries) ? settings.maxNetworkRetries : this._stripe.getMaxNetworkRetries();
      }
      _defaultIdempotencyKey(method, settings, apiMode) {
        const maxRetries = this._getMaxNetworkRetries(settings);
        const genKey = /* @__PURE__ */ __name(() => `stripe-node-retry-${this._stripe._platformFunctions.uuid4()}`, "genKey");
        if (apiMode === "v2") {
          if (method === "POST" || method === "DELETE") {
            return genKey();
          }
        } else if (apiMode === "v1") {
          if (method === "POST" && maxRetries > 0) {
            return genKey();
          }
        }
        return null;
      }
      _makeHeaders({ contentType, contentLength, apiVersion, clientUserAgent, method, userSuppliedHeaders, userSuppliedSettings, stripeAccount, stripeContext, apiMode }) {
        const defaultHeaders = {
          Accept: "application/json",
          "Content-Type": contentType,
          "User-Agent": this._getUserAgentString(apiMode),
          "X-Stripe-Client-User-Agent": clientUserAgent,
          "X-Stripe-Client-Telemetry": this._getTelemetryHeader(),
          "Stripe-Version": apiVersion,
          "Stripe-Account": stripeAccount,
          "Stripe-Context": stripeContext,
          "Idempotency-Key": this._defaultIdempotencyKey(method, userSuppliedSettings, apiMode)
        };
        const methodHasPayload = method == "POST" || method == "PUT" || method == "PATCH";
        if (methodHasPayload || contentLength) {
          if (!methodHasPayload) {
            emitWarning(`${method} method had non-zero contentLength but no payload is expected for this verb`);
          }
          defaultHeaders["Content-Length"] = contentLength;
        }
        return Object.assign(
          removeNullish(defaultHeaders),
          // If the user supplied, say 'idempotency-key', override instead of appending by ensuring caps are the same.
          normalizeHeaders(userSuppliedHeaders)
        );
      }
      _getUserAgentString(apiMode) {
        const packageVersion = this._stripe.getConstant("PACKAGE_VERSION");
        const appInfo = this._stripe._appInfo ? this._stripe.getAppInfoAsString() : "";
        return `Stripe/${apiMode} NodeBindings/${packageVersion} ${appInfo}`.trim();
      }
      _getTelemetryHeader() {
        if (this._stripe.getTelemetryEnabled() && this._stripe._prevRequestMetrics.length > 0) {
          const metrics = this._stripe._prevRequestMetrics.shift();
          return JSON.stringify({
            last_request_metrics: metrics
          });
        }
      }
      _recordRequestMetrics(requestId, requestDurationMs, usage) {
        if (this._stripe.getTelemetryEnabled() && requestId) {
          if (this._stripe._prevRequestMetrics.length > this._maxBufferedRequestMetric) {
            emitWarning("Request metrics buffer is full, dropping telemetry message.");
          } else {
            const m = {
              request_id: requestId,
              request_duration_ms: requestDurationMs
            };
            if (usage && usage.length > 0) {
              m.usage = usage;
            }
            this._stripe._prevRequestMetrics.push(m);
          }
        }
      }
      _rawRequest(method, path, params, options, usage) {
        const requestPromise = new Promise((resolve, reject) => {
          let opts;
          try {
            const requestMethod = method.toUpperCase();
            if (requestMethod !== "POST" && params && Object.keys(params).length !== 0) {
              throw new Error("rawRequest only supports params on POST requests. Please pass null and add your parameters to path.");
            }
            const args = [].slice.call([params, options]);
            const dataFromArgs = getDataFromArgs(args);
            const data = requestMethod === "POST" ? Object.assign({}, dataFromArgs) : null;
            const calculatedOptions = getOptionsFromArgs(args);
            const headers2 = calculatedOptions.headers;
            const authenticator2 = calculatedOptions.authenticator;
            opts = {
              requestMethod,
              requestPath: path,
              bodyData: data,
              queryData: {},
              authenticator: authenticator2,
              headers: headers2,
              host: calculatedOptions.host,
              streaming: !!calculatedOptions.streaming,
              settings: {},
              // We use this for thin event internals, so we should record the more specific `usage`, when available
              usage: usage || ["raw_request"]
            };
          } catch (err) {
            reject(err);
            return;
          }
          function requestCallback(err, response) {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          }
          __name(requestCallback, "requestCallback");
          const { headers, settings } = opts;
          const authenticator = opts.authenticator;
          this._request(opts.requestMethod, opts.host, path, opts.bodyData, authenticator, { headers, settings, streaming: opts.streaming }, opts.usage, requestCallback);
        });
        return requestPromise;
      }
      _getContentLength(data) {
        return typeof data === "string" ? new TextEncoder().encode(data).length : data.length;
      }
      _request(method, host, path, data, authenticator, options, usage = [], callback, requestDataProcessor = null) {
        var _a;
        let requestData;
        authenticator = (_a = authenticator !== null && authenticator !== void 0 ? authenticator : this._stripe._authenticator) !== null && _a !== void 0 ? _a : null;
        const apiMode = getAPIMode(path);
        const retryRequest = /* @__PURE__ */ __name((requestFn, apiVersion, headers, requestRetries, retryAfter) => {
          return setTimeout(requestFn, this._getSleepTimeInMS(requestRetries, retryAfter), apiVersion, headers, requestRetries + 1);
        }, "retryRequest");
        const makeRequest = /* @__PURE__ */ __name((apiVersion, headers, numRetries) => {
          const timeout = options.settings && options.settings.timeout && Number.isInteger(options.settings.timeout) && options.settings.timeout >= 0 ? options.settings.timeout : this._stripe.getApiField("timeout");
          const request = {
            host: host || this._stripe.getApiField("host"),
            port: this._stripe.getApiField("port"),
            path,
            method,
            headers: Object.assign({}, headers),
            body: requestData,
            protocol: this._stripe.getApiField("protocol")
          };
          authenticator(request).then(() => {
            const req = this._stripe.getApiField("httpClient").makeRequest(request.host, request.port, request.path, request.method, request.headers, request.body, request.protocol, timeout);
            const requestStartTime = Date.now();
            const requestEvent = removeNullish({
              api_version: apiVersion,
              account: parseHttpHeaderAsString(headers["Stripe-Account"]),
              idempotency_key: parseHttpHeaderAsString(headers["Idempotency-Key"]),
              method,
              path,
              request_start_time: requestStartTime
            });
            const requestRetries = numRetries || 0;
            const maxRetries = this._getMaxNetworkRetries(options.settings || {});
            this._stripe._emitter.emit("request", requestEvent);
            req.then((res) => {
              if (_RequestSender._shouldRetry(res, requestRetries, maxRetries)) {
                return retryRequest(makeRequest, apiVersion, headers, requestRetries, parseHttpHeaderAsNumber(res.getHeaders()["retry-after"]));
              } else if (options.streaming && res.getStatusCode() < 400) {
                return this._streamingResponseHandler(requestEvent, usage, callback)(res);
              } else {
                return this._jsonResponseHandler(requestEvent, apiMode, usage, callback)(res);
              }
            }).catch((error) => {
              if (_RequestSender._shouldRetry(null, requestRetries, maxRetries, error)) {
                return retryRequest(makeRequest, apiVersion, headers, requestRetries, null);
              } else {
                const isTimeoutError = error.code && error.code === HttpClient.TIMEOUT_ERROR_CODE;
                return callback(new StripeConnectionError({
                  message: isTimeoutError ? `Request aborted due to timeout being reached (${timeout}ms)` : _RequestSender._generateConnectionErrorMessage(requestRetries),
                  detail: error
                }));
              }
            });
          }).catch((e) => {
            throw new StripeError({
              message: "Unable to authenticate the request",
              exception: e
            });
          });
        }, "makeRequest");
        const prepareAndMakeRequest = /* @__PURE__ */ __name((error, data2) => {
          if (error) {
            return callback(error);
          }
          requestData = data2;
          this._stripe.getClientUserAgent((clientUserAgent) => {
            var _a2, _b, _c;
            const apiVersion = this._stripe.getApiField("version");
            const headers = this._makeHeaders({
              contentType: apiMode == "v2" ? "application/json" : "application/x-www-form-urlencoded",
              contentLength: this._getContentLength(data2),
              apiVersion,
              clientUserAgent,
              method,
              // other callers expect null, but .headers being optional means it's undefined if not supplied. So we normalize to null.
              userSuppliedHeaders: (_a2 = options.headers) !== null && _a2 !== void 0 ? _a2 : null,
              userSuppliedSettings: (_b = options.settings) !== null && _b !== void 0 ? _b : {},
              stripeAccount: (_c = options.stripeAccount) !== null && _c !== void 0 ? _c : this._stripe.getApiField("stripeAccount"),
              stripeContext: this._normalizeStripeContext(options.stripeContext, this._stripe.getApiField("stripeContext")),
              apiMode
            });
            makeRequest(apiVersion, headers, 0);
          });
        }, "prepareAndMakeRequest");
        if (requestDataProcessor) {
          requestDataProcessor(method, data, options.headers, prepareAndMakeRequest);
        } else {
          let stringifiedData;
          if (apiMode == "v2") {
            stringifiedData = data ? jsonStringifyRequestData(data) : "";
          } else {
            stringifiedData = queryStringifyRequestData(data || {});
          }
          prepareAndMakeRequest(null, stringifiedData);
        }
      }
    };
  }
});

// ../node_modules/stripe/esm/autoPagination.js
function getAsyncIteratorSymbol() {
  if (typeof Symbol !== "undefined" && Symbol.asyncIterator) {
    return Symbol.asyncIterator;
  }
  return "@@asyncIterator";
}
function getDoneCallback(args) {
  if (args.length < 2) {
    return null;
  }
  const onDone = args[1];
  if (typeof onDone !== "function") {
    throw Error(`The second argument to autoPagingEach, if present, must be a callback function; received ${typeof onDone}`);
  }
  return onDone;
}
function getItemCallback(args) {
  if (args.length === 0) {
    return void 0;
  }
  const onItem = args[0];
  if (typeof onItem !== "function") {
    throw Error(`The first argument to autoPagingEach, if present, must be a callback function; received ${typeof onItem}`);
  }
  if (onItem.length === 2) {
    return onItem;
  }
  if (onItem.length > 2) {
    throw Error(`The \`onItem\` callback function passed to autoPagingEach must accept at most two arguments; got ${onItem}`);
  }
  return /* @__PURE__ */ __name(function _onItem(item, next) {
    const shouldContinue = onItem(item);
    next(shouldContinue);
  }, "_onItem");
}
function getLastId(listResult, reverseIteration) {
  const lastIdx = reverseIteration ? 0 : listResult.data.length - 1;
  const lastItem = listResult.data[lastIdx];
  const lastId = lastItem && lastItem.id;
  if (!lastId) {
    throw Error("Unexpected: No `id` found on the last item while auto-paging a list.");
  }
  return lastId;
}
function makeAutoPagingEach(asyncIteratorNext) {
  return /* @__PURE__ */ __name(function autoPagingEach() {
    const args = [].slice.call(arguments);
    const onItem = getItemCallback(args);
    const onDone = getDoneCallback(args);
    if (args.length > 2) {
      throw Error(`autoPagingEach takes up to two arguments; received ${args}`);
    }
    const autoPagePromise = wrapAsyncIteratorWithCallback(
      asyncIteratorNext,
      // @ts-ignore we might need a null check
      onItem
    );
    return callbackifyPromiseWithTimeout(autoPagePromise, onDone);
  }, "autoPagingEach");
}
function makeAutoPagingToArray(autoPagingEach) {
  return /* @__PURE__ */ __name(function autoPagingToArray(opts, onDone) {
    const limit = opts && opts.limit;
    if (!limit) {
      throw Error("You must pass a `limit` option to autoPagingToArray, e.g., `autoPagingToArray({limit: 1000});`.");
    }
    if (limit > 1e4) {
      throw Error("You cannot specify a limit of more than 10,000 items to fetch in `autoPagingToArray`; use `autoPagingEach` to iterate through longer lists.");
    }
    const promise = new Promise((resolve, reject) => {
      const items = [];
      autoPagingEach((item) => {
        items.push(item);
        if (items.length >= limit) {
          return false;
        }
      }).then(() => {
        resolve(items);
      }).catch(reject);
    });
    return callbackifyPromiseWithTimeout(promise, onDone);
  }, "autoPagingToArray");
}
function wrapAsyncIteratorWithCallback(asyncIteratorNext, onItem) {
  return new Promise((resolve, reject) => {
    function handleIteration(iterResult) {
      if (iterResult.done) {
        resolve();
        return;
      }
      const item = iterResult.value;
      return new Promise((next) => {
        onItem(item, next);
      }).then((shouldContinue) => {
        if (shouldContinue === false) {
          return handleIteration({ done: true, value: void 0 });
        } else {
          return asyncIteratorNext().then(handleIteration);
        }
      });
    }
    __name(handleIteration, "handleIteration");
    asyncIteratorNext().then(handleIteration).catch(reject);
  });
}
function isReverseIteration(requestArgs) {
  const args = [].slice.call(requestArgs);
  const dataFromArgs = getDataFromArgs(args);
  return !!dataFromArgs.ending_before;
}
var V1Iterator, V1ListIterator, V1SearchIterator, V2ListIterator, makeAutoPaginationMethods, makeAutoPaginationMethodsFromIterator;
var init_autoPagination = __esm({
  "../node_modules/stripe/esm/autoPagination.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_utils();
    V1Iterator = class {
      static {
        __name(this, "V1Iterator");
      }
      constructor(firstPagePromise, requestArgs, spec, stripeResource) {
        this.index = 0;
        this.pagePromise = firstPagePromise;
        this.promiseCache = { currentPromise: null };
        this.requestArgs = requestArgs;
        this.spec = spec;
        this.stripeResource = stripeResource;
      }
      async iterate(pageResult) {
        if (!(pageResult && pageResult.data && typeof pageResult.data.length === "number")) {
          throw Error("Unexpected: Stripe API response does not have a well-formed `data` array.");
        }
        const reverseIteration = isReverseIteration(this.requestArgs);
        if (this.index < pageResult.data.length) {
          const idx = reverseIteration ? pageResult.data.length - 1 - this.index : this.index;
          const value = pageResult.data[idx];
          this.index += 1;
          return { value, done: false };
        } else if (pageResult.has_more) {
          this.index = 0;
          this.pagePromise = this.getNextPage(pageResult);
          const nextPageResult = await this.pagePromise;
          return this.iterate(nextPageResult);
        }
        return { done: true, value: void 0 };
      }
      /** @abstract */
      getNextPage(_pageResult) {
        throw new Error("Unimplemented");
      }
      async _next() {
        return this.iterate(await this.pagePromise);
      }
      next() {
        if (this.promiseCache.currentPromise) {
          return this.promiseCache.currentPromise;
        }
        const nextPromise = (async () => {
          const ret = await this._next();
          this.promiseCache.currentPromise = null;
          return ret;
        })();
        this.promiseCache.currentPromise = nextPromise;
        return nextPromise;
      }
    };
    V1ListIterator = class extends V1Iterator {
      static {
        __name(this, "V1ListIterator");
      }
      getNextPage(pageResult) {
        const reverseIteration = isReverseIteration(this.requestArgs);
        const lastId = getLastId(pageResult, reverseIteration);
        return this.stripeResource._makeRequest(this.requestArgs, this.spec, {
          [reverseIteration ? "ending_before" : "starting_after"]: lastId
        });
      }
    };
    V1SearchIterator = class extends V1Iterator {
      static {
        __name(this, "V1SearchIterator");
      }
      getNextPage(pageResult) {
        if (!pageResult.next_page) {
          throw Error("Unexpected: Stripe API response does not have a well-formed `next_page` field, but `has_more` was true.");
        }
        return this.stripeResource._makeRequest(this.requestArgs, this.spec, {
          page: pageResult.next_page
        });
      }
    };
    V2ListIterator = class {
      static {
        __name(this, "V2ListIterator");
      }
      constructor(firstPagePromise, requestArgs, spec, stripeResource) {
        this.firstPagePromise = firstPagePromise;
        this.currentPageIterator = null;
        this.nextPageUrl = null;
        this.requestArgs = requestArgs;
        this.spec = spec;
        this.stripeResource = stripeResource;
      }
      async initFirstPage() {
        if (this.firstPagePromise) {
          const page = await this.firstPagePromise;
          this.firstPagePromise = null;
          this.currentPageIterator = page.data[Symbol.iterator]();
          this.nextPageUrl = page.next_page_url || null;
        }
      }
      async turnPage() {
        if (!this.nextPageUrl)
          return null;
        this.spec.fullPath = this.nextPageUrl;
        const page = await this.stripeResource._makeRequest([], this.spec, {});
        this.nextPageUrl = page.next_page_url || null;
        this.currentPageIterator = page.data[Symbol.iterator]();
        return this.currentPageIterator;
      }
      async next() {
        await this.initFirstPage();
        if (this.currentPageIterator) {
          const result2 = this.currentPageIterator.next();
          if (!result2.done)
            return { done: false, value: result2.value };
        }
        const nextPageIterator = await this.turnPage();
        if (!nextPageIterator) {
          return { done: true, value: void 0 };
        }
        const result = nextPageIterator.next();
        if (!result.done)
          return { done: false, value: result.value };
        return { done: true, value: void 0 };
      }
    };
    makeAutoPaginationMethods = /* @__PURE__ */ __name((stripeResource, requestArgs, spec, firstPagePromise) => {
      const apiMode = getAPIMode(spec.fullPath || spec.path);
      if (apiMode !== "v2" && spec.methodType === "search") {
        return makeAutoPaginationMethodsFromIterator(new V1SearchIterator(firstPagePromise, requestArgs, spec, stripeResource));
      }
      if (apiMode !== "v2" && spec.methodType === "list") {
        return makeAutoPaginationMethodsFromIterator(new V1ListIterator(firstPagePromise, requestArgs, spec, stripeResource));
      }
      if (apiMode === "v2" && spec.methodType === "list") {
        return makeAutoPaginationMethodsFromIterator(new V2ListIterator(firstPagePromise, requestArgs, spec, stripeResource));
      }
      return null;
    }, "makeAutoPaginationMethods");
    makeAutoPaginationMethodsFromIterator = /* @__PURE__ */ __name((iterator) => {
      const autoPagingEach = makeAutoPagingEach((...args) => iterator.next(...args));
      const autoPagingToArray = makeAutoPagingToArray(autoPagingEach);
      const autoPaginationMethods = {
        autoPagingEach,
        autoPagingToArray,
        // Async iterator functions:
        next: /* @__PURE__ */ __name(() => iterator.next(), "next"),
        return: /* @__PURE__ */ __name(() => {
          return {};
        }, "return"),
        [getAsyncIteratorSymbol()]: () => {
          return autoPaginationMethods;
        }
      };
      return autoPaginationMethods;
    }, "makeAutoPaginationMethodsFromIterator");
    __name(getAsyncIteratorSymbol, "getAsyncIteratorSymbol");
    __name(getDoneCallback, "getDoneCallback");
    __name(getItemCallback, "getItemCallback");
    __name(getLastId, "getLastId");
    __name(makeAutoPagingEach, "makeAutoPagingEach");
    __name(makeAutoPagingToArray, "makeAutoPagingToArray");
    __name(wrapAsyncIteratorWithCallback, "wrapAsyncIteratorWithCallback");
    __name(isReverseIteration, "isReverseIteration");
  }
});

// ../node_modules/stripe/esm/StripeMethod.js
function stripeMethod(spec) {
  if (spec.path !== void 0 && spec.fullPath !== void 0) {
    throw new Error(`Method spec specified both a 'path' (${spec.path}) and a 'fullPath' (${spec.fullPath}).`);
  }
  return function(...args) {
    const callback = typeof args[args.length - 1] == "function" && args.pop();
    spec.urlParams = extractUrlParams(spec.fullPath || this.createResourcePathWithSymbols(spec.path || ""));
    const requestPromise = callbackifyPromiseWithTimeout(this._makeRequest(args, spec, {}), callback);
    Object.assign(requestPromise, makeAutoPaginationMethods(this, args, spec, requestPromise));
    return requestPromise;
  };
}
var init_StripeMethod = __esm({
  "../node_modules/stripe/esm/StripeMethod.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_utils();
    init_autoPagination();
    __name(stripeMethod, "stripeMethod");
  }
});

// ../node_modules/stripe/esm/StripeResource.js
function StripeResource(stripe, deprecatedUrlData) {
  this._stripe = stripe;
  if (deprecatedUrlData) {
    throw new Error("Support for curried url params was dropped in stripe-node v7.0.0. Instead, pass two ids.");
  }
  this.basePath = makeURLInterpolator(
    // @ts-ignore changing type of basePath
    this.basePath || stripe.getApiField("basePath")
  );
  this.resourcePath = this.path;
  this.path = makeURLInterpolator(this.path);
  this.initialize(...arguments);
}
var init_StripeResource = __esm({
  "../node_modules/stripe/esm/StripeResource.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_utils();
    init_StripeMethod();
    StripeResource.extend = protoExtend;
    StripeResource.method = stripeMethod;
    StripeResource.MAX_BUFFERED_REQUEST_METRICS = 100;
    __name(StripeResource, "StripeResource");
    StripeResource.prototype = {
      _stripe: null,
      // @ts-ignore the type of path changes in ctor
      path: "",
      resourcePath: "",
      // Methods that don't use the API's default '/v1' path can override it with this setting.
      basePath: null,
      initialize() {
      },
      // Function to override the default data processor. This allows full control
      // over how a StripeResource's request data will get converted into an HTTP
      // body. This is useful for non-standard HTTP requests. The function should
      // take method name, data, and headers as arguments.
      requestDataProcessor: null,
      // Function to add a validation checks before sending the request, errors should
      // be thrown, and they will be passed to the callback/promise.
      validateRequest: null,
      createFullPath(commandPath, urlData) {
        const urlParts = [this.basePath(urlData), this.path(urlData)];
        if (typeof commandPath === "function") {
          const computedCommandPath = commandPath(urlData);
          if (computedCommandPath) {
            urlParts.push(computedCommandPath);
          }
        } else {
          urlParts.push(commandPath);
        }
        return this._joinUrlParts(urlParts);
      },
      // Creates a relative resource path with symbols left in (unlike
      // createFullPath which takes some data to replace them with). For example it
      // might produce: /invoices/{id}
      createResourcePathWithSymbols(pathWithSymbols) {
        if (pathWithSymbols) {
          return `/${this._joinUrlParts([this.resourcePath, pathWithSymbols])}`;
        } else {
          return `/${this.resourcePath}`;
        }
      },
      _joinUrlParts(parts) {
        return parts.join("/").replace(/\/{2,}/g, "/");
      },
      _getRequestOpts(requestArgs, spec, overrideData) {
        var _a;
        const requestMethod = (spec.method || "GET").toUpperCase();
        const usage = spec.usage || [];
        const urlParams = spec.urlParams || [];
        const encode = spec.encode || ((data2) => data2);
        const isUsingFullPath = !!spec.fullPath;
        const commandPath = makeURLInterpolator(isUsingFullPath ? spec.fullPath : spec.path || "");
        const path = isUsingFullPath ? spec.fullPath : this.createResourcePathWithSymbols(spec.path);
        const args = [].slice.call(requestArgs);
        const urlData = urlParams.reduce((urlData2, param) => {
          const arg = args.shift();
          if (typeof arg !== "string") {
            throw new Error(`Stripe: Argument "${param}" must be a string, but got: ${arg} (on API request to \`${requestMethod} ${path}\`)`);
          }
          urlData2[param] = arg;
          return urlData2;
        }, {});
        const dataFromArgs = getDataFromArgs(args);
        const data = encode(Object.assign({}, dataFromArgs, overrideData));
        const options = getOptionsFromArgs(args);
        const host = options.host || spec.host;
        const streaming = !!spec.streaming || !!options.streaming;
        if (args.filter((x) => x != null).length) {
          throw new Error(`Stripe: Unknown arguments (${args}). Did you mean to pass an options object? See https://github.com/stripe/stripe-node/wiki/Passing-Options. (on API request to ${requestMethod} \`${path}\`)`);
        }
        const requestPath = isUsingFullPath ? commandPath(urlData) : this.createFullPath(commandPath, urlData);
        const headers = Object.assign(options.headers, spec.headers);
        if (spec.validator) {
          spec.validator(data, { headers });
        }
        const dataInQuery = spec.method === "GET" || spec.method === "DELETE";
        const bodyData = dataInQuery ? null : data;
        const queryData = dataInQuery ? data : {};
        return {
          requestMethod,
          requestPath,
          bodyData,
          queryData,
          authenticator: (_a = options.authenticator) !== null && _a !== void 0 ? _a : null,
          headers,
          host: host !== null && host !== void 0 ? host : null,
          streaming,
          settings: options.settings,
          usage
        };
      },
      _makeRequest(requestArgs, spec, overrideData) {
        return new Promise((resolve, reject) => {
          var _a;
          let opts;
          try {
            opts = this._getRequestOpts(requestArgs, spec, overrideData);
          } catch (err) {
            reject(err);
            return;
          }
          function requestCallback(err, response) {
            if (err) {
              reject(err);
            } else {
              resolve(spec.transformResponseData ? spec.transformResponseData(response) : response);
            }
          }
          __name(requestCallback, "requestCallback");
          const emptyQuery = Object.keys(opts.queryData).length === 0;
          const path = [
            opts.requestPath,
            emptyQuery ? "" : "?",
            queryStringifyRequestData(opts.queryData)
          ].join("");
          const { headers, settings } = opts;
          this._stripe._requestSender._request(opts.requestMethod, opts.host, path, opts.bodyData, opts.authenticator, {
            headers,
            settings,
            streaming: opts.streaming
          }, opts.usage, requestCallback, (_a = this.requestDataProcessor) === null || _a === void 0 ? void 0 : _a.bind(this));
        });
      }
    };
  }
});

// ../node_modules/stripe/esm/StripeContext.js
var StripeContext;
var init_StripeContext = __esm({
  "../node_modules/stripe/esm/StripeContext.js"() {
    init_functionsRoutes_0_7157080303585999();
    StripeContext = class _StripeContext {
      static {
        __name(this, "StripeContext");
      }
      /**
       * Creates a new StripeContext with the given segments.
       */
      constructor(segments = []) {
        this._segments = [...segments];
      }
      /**
       * Gets a copy of the segments of this Context.
       */
      get segments() {
        return [...this._segments];
      }
      /**
       * Creates a new StripeContext with an additional segment appended.
       */
      push(segment) {
        if (!segment) {
          throw new Error("Segment cannot be null or undefined");
        }
        return new _StripeContext([...this._segments, segment]);
      }
      /**
       * Creates a new StripeContext with the last segment removed.
       * If there are no segments, throws an error.
       */
      pop() {
        if (this._segments.length === 0) {
          throw new Error("Cannot pop from an empty context");
        }
        return new _StripeContext(this._segments.slice(0, -1));
      }
      /**
       * Converts this context to its string representation.
       */
      toString() {
        return this._segments.join("/");
      }
      /**
       * Parses a context string into a StripeContext instance.
       */
      static parse(contextStr) {
        if (!contextStr) {
          return new _StripeContext([]);
        }
        return new _StripeContext(contextStr.split("/"));
      }
    };
  }
});

// ../node_modules/stripe/esm/Webhooks.js
function createWebhooks(platformFunctions) {
  const Webhook = {
    DEFAULT_TOLERANCE: 300,
    signature: null,
    constructEvent(payload, header, secret, tolerance, cryptoProvider, receivedAt) {
      try {
        if (!this.signature) {
          throw new Error("ERR: missing signature helper, unable to verify");
        }
        this.signature.verifyHeader(payload, header, secret, tolerance || Webhook.DEFAULT_TOLERANCE, cryptoProvider, receivedAt);
      } catch (e) {
        if (e instanceof CryptoProviderOnlySupportsAsyncError) {
          e.message += "\nUse `await constructEventAsync(...)` instead of `constructEvent(...)`";
        }
        throw e;
      }
      const jsonPayload = payload instanceof Uint8Array ? JSON.parse(new TextDecoder("utf8").decode(payload)) : JSON.parse(payload);
      return jsonPayload;
    },
    async constructEventAsync(payload, header, secret, tolerance, cryptoProvider, receivedAt) {
      if (!this.signature) {
        throw new Error("ERR: missing signature helper, unable to verify");
      }
      await this.signature.verifyHeaderAsync(payload, header, secret, tolerance || Webhook.DEFAULT_TOLERANCE, cryptoProvider, receivedAt);
      const jsonPayload = payload instanceof Uint8Array ? JSON.parse(new TextDecoder("utf8").decode(payload)) : JSON.parse(payload);
      return jsonPayload;
    },
    /**
     * Generates a header to be used for webhook mocking
     *
     * @typedef {object} opts
     * @property {number} timestamp - Timestamp of the header. Defaults to Date.now()
     * @property {string} payload - JSON stringified payload object, containing the 'id' and 'object' parameters
     * @property {string} secret - Stripe webhook secret 'whsec_...'
     * @property {string} scheme - Version of API to hit. Defaults to 'v1'.
     * @property {string} signature - Computed webhook signature
     * @property {CryptoProvider} cryptoProvider - Crypto provider to use for computing the signature if none was provided. Defaults to NodeCryptoProvider.
     */
    generateTestHeaderString: /* @__PURE__ */ __name(function(opts) {
      const preparedOpts = prepareOptions(opts);
      const signature2 = preparedOpts.signature || preparedOpts.cryptoProvider.computeHMACSignature(preparedOpts.payloadString, preparedOpts.secret);
      return preparedOpts.generateHeaderString(signature2);
    }, "generateTestHeaderString"),
    generateTestHeaderStringAsync: /* @__PURE__ */ __name(async function(opts) {
      const preparedOpts = prepareOptions(opts);
      const signature2 = preparedOpts.signature || await preparedOpts.cryptoProvider.computeHMACSignatureAsync(preparedOpts.payloadString, preparedOpts.secret);
      return preparedOpts.generateHeaderString(signature2);
    }, "generateTestHeaderStringAsync")
  };
  const signature = {
    EXPECTED_SCHEME: "v1",
    verifyHeader(encodedPayload, encodedHeader, secret, tolerance, cryptoProvider, receivedAt) {
      const { decodedHeader: header, decodedPayload: payload, details, suspectPayloadType } = parseEventDetails(encodedPayload, encodedHeader, this.EXPECTED_SCHEME);
      const secretContainsWhitespace = /\s/.test(secret);
      cryptoProvider = cryptoProvider || getCryptoProvider();
      const expectedSignature = cryptoProvider.computeHMACSignature(makeHMACContent(payload, details), secret);
      validateComputedSignature(payload, header, details, expectedSignature, tolerance, suspectPayloadType, secretContainsWhitespace, receivedAt);
      return true;
    },
    async verifyHeaderAsync(encodedPayload, encodedHeader, secret, tolerance, cryptoProvider, receivedAt) {
      const { decodedHeader: header, decodedPayload: payload, details, suspectPayloadType } = parseEventDetails(encodedPayload, encodedHeader, this.EXPECTED_SCHEME);
      const secretContainsWhitespace = /\s/.test(secret);
      cryptoProvider = cryptoProvider || getCryptoProvider();
      const expectedSignature = await cryptoProvider.computeHMACSignatureAsync(makeHMACContent(payload, details), secret);
      return validateComputedSignature(payload, header, details, expectedSignature, tolerance, suspectPayloadType, secretContainsWhitespace, receivedAt);
    }
  };
  function makeHMACContent(payload, details) {
    return `${details.timestamp}.${payload}`;
  }
  __name(makeHMACContent, "makeHMACContent");
  function parseEventDetails(encodedPayload, encodedHeader, expectedScheme) {
    if (!encodedPayload) {
      throw new StripeSignatureVerificationError(encodedHeader, encodedPayload, {
        message: "No webhook payload was provided."
      });
    }
    const suspectPayloadType = typeof encodedPayload != "string" && !(encodedPayload instanceof Uint8Array);
    const textDecoder = new TextDecoder("utf8");
    const decodedPayload = encodedPayload instanceof Uint8Array ? textDecoder.decode(encodedPayload) : encodedPayload;
    if (Array.isArray(encodedHeader)) {
      throw new Error("Unexpected: An array was passed as a header, which should not be possible for the stripe-signature header.");
    }
    if (encodedHeader == null || encodedHeader == "") {
      throw new StripeSignatureVerificationError(encodedHeader, encodedPayload, {
        message: "No stripe-signature header value was provided."
      });
    }
    const decodedHeader = encodedHeader instanceof Uint8Array ? textDecoder.decode(encodedHeader) : encodedHeader;
    const details = parseHeader(decodedHeader, expectedScheme);
    if (!details || details.timestamp === -1) {
      throw new StripeSignatureVerificationError(decodedHeader, decodedPayload, {
        message: "Unable to extract timestamp and signatures from header"
      });
    }
    if (!details.signatures.length) {
      throw new StripeSignatureVerificationError(decodedHeader, decodedPayload, {
        message: "No signatures found with expected scheme"
      });
    }
    return {
      decodedPayload,
      decodedHeader,
      details,
      suspectPayloadType
    };
  }
  __name(parseEventDetails, "parseEventDetails");
  function validateComputedSignature(payload, header, details, expectedSignature, tolerance, suspectPayloadType, secretContainsWhitespace, receivedAt) {
    const signatureFound = !!details.signatures.filter(platformFunctions.secureCompare.bind(platformFunctions, expectedSignature)).length;
    const docsLocation = "\nLearn more about webhook signing and explore webhook integration examples for various frameworks at https://docs.stripe.com/webhooks/signature";
    const whitespaceMessage = secretContainsWhitespace ? "\n\nNote: The provided signing secret contains whitespace. This often indicates an extra newline or space is in the value" : "";
    if (!signatureFound) {
      if (suspectPayloadType) {
        throw new StripeSignatureVerificationError(header, payload, {
          message: "Webhook payload must be provided as a string or a Buffer (https://nodejs.org/api/buffer.html) instance representing the _raw_ request body.Payload was provided as a parsed JavaScript object instead. \nSignature verification is impossible without access to the original signed material. \n" + docsLocation + "\n" + whitespaceMessage
        });
      }
      throw new StripeSignatureVerificationError(header, payload, {
        message: "No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe? \n If a webhook request is being forwarded by a third-party tool, ensure that the exact request body, including JSON formatting and new line style, is preserved.\n" + docsLocation + "\n" + whitespaceMessage
      });
    }
    const timestampAge = Math.floor((typeof receivedAt === "number" ? receivedAt : Date.now()) / 1e3) - details.timestamp;
    if (tolerance > 0 && timestampAge > tolerance) {
      throw new StripeSignatureVerificationError(header, payload, {
        message: "Timestamp outside the tolerance zone"
      });
    }
    return true;
  }
  __name(validateComputedSignature, "validateComputedSignature");
  function parseHeader(header, scheme) {
    if (typeof header !== "string") {
      return null;
    }
    return header.split(",").reduce((accum, item) => {
      const kv = item.split("=");
      if (kv[0] === "t") {
        accum.timestamp = parseInt(kv[1], 10);
      }
      if (kv[0] === scheme) {
        accum.signatures.push(kv[1]);
      }
      return accum;
    }, {
      timestamp: -1,
      signatures: []
    });
  }
  __name(parseHeader, "parseHeader");
  let webhooksCryptoProviderInstance = null;
  function getCryptoProvider() {
    if (!webhooksCryptoProviderInstance) {
      webhooksCryptoProviderInstance = platformFunctions.createDefaultCryptoProvider();
    }
    return webhooksCryptoProviderInstance;
  }
  __name(getCryptoProvider, "getCryptoProvider");
  function prepareOptions(opts) {
    if (!opts) {
      throw new StripeError({
        message: "Options are required"
      });
    }
    const timestamp = Math.floor(opts.timestamp) || Math.floor(Date.now() / 1e3);
    const scheme = opts.scheme || signature.EXPECTED_SCHEME;
    const cryptoProvider = opts.cryptoProvider || getCryptoProvider();
    const payloadString = `${timestamp}.${opts.payload}`;
    const generateHeaderString = /* @__PURE__ */ __name((signature2) => {
      return `t=${timestamp},${scheme}=${signature2}`;
    }, "generateHeaderString");
    return Object.assign(Object.assign({}, opts), {
      timestamp,
      scheme,
      cryptoProvider,
      payloadString,
      generateHeaderString
    });
  }
  __name(prepareOptions, "prepareOptions");
  Webhook.signature = signature;
  return Webhook;
}
var init_Webhooks = __esm({
  "../node_modules/stripe/esm/Webhooks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_Error();
    init_CryptoProvider();
    __name(createWebhooks, "createWebhooks");
  }
});

// ../node_modules/stripe/esm/apiVersion.js
var ApiVersion;
var init_apiVersion = __esm({
  "../node_modules/stripe/esm/apiVersion.js"() {
    init_functionsRoutes_0_7157080303585999();
    ApiVersion = "2026-02-25.clover";
  }
});

// ../node_modules/stripe/esm/ResourceNamespace.js
function ResourceNamespace(stripe, resources) {
  for (const name in resources) {
    if (!Object.prototype.hasOwnProperty.call(resources, name)) {
      continue;
    }
    const camelCaseName = name[0].toLowerCase() + name.substring(1);
    const resource = new resources[name](stripe);
    this[camelCaseName] = resource;
  }
}
function resourceNamespace(namespace, resources) {
  return function(stripe) {
    return new ResourceNamespace(stripe, resources);
  };
}
var init_ResourceNamespace = __esm({
  "../node_modules/stripe/esm/ResourceNamespace.js"() {
    init_functionsRoutes_0_7157080303585999();
    __name(ResourceNamespace, "ResourceNamespace");
    __name(resourceNamespace, "resourceNamespace");
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/AccountLinks.js
var stripeMethod2, AccountLinks;
var init_AccountLinks = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/AccountLinks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod2 = StripeResource.method;
    AccountLinks = StripeResource.extend({
      create: stripeMethod2({ method: "POST", fullPath: "/v2/core/account_links" })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/AccountTokens.js
var stripeMethod3, AccountTokens;
var init_AccountTokens = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/AccountTokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod3 = StripeResource.method;
    AccountTokens = StripeResource.extend({
      create: stripeMethod3({ method: "POST", fullPath: "/v2/core/account_tokens" }),
      retrieve: stripeMethod3({
        method: "GET",
        fullPath: "/v2/core/account_tokens/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FinancialConnections/Accounts.js
var stripeMethod4, Accounts;
var init_Accounts = __esm({
  "../node_modules/stripe/esm/resources/FinancialConnections/Accounts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod4 = StripeResource.method;
    Accounts = StripeResource.extend({
      retrieve: stripeMethod4({
        method: "GET",
        fullPath: "/v1/financial_connections/accounts/{account}"
      }),
      list: stripeMethod4({
        method: "GET",
        fullPath: "/v1/financial_connections/accounts",
        methodType: "list"
      }),
      disconnect: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/disconnect"
      }),
      listOwners: stripeMethod4({
        method: "GET",
        fullPath: "/v1/financial_connections/accounts/{account}/owners",
        methodType: "list"
      }),
      refresh: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/refresh"
      }),
      subscribe: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/subscribe"
      }),
      unsubscribe: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/unsubscribe"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Accounts/Persons.js
var stripeMethod5, Persons;
var init_Persons = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Accounts/Persons.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod5 = StripeResource.method;
    Persons = StripeResource.extend({
      create: stripeMethod5({
        method: "POST",
        fullPath: "/v2/core/accounts/{account_id}/persons"
      }),
      retrieve: stripeMethod5({
        method: "GET",
        fullPath: "/v2/core/accounts/{account_id}/persons/{id}"
      }),
      update: stripeMethod5({
        method: "POST",
        fullPath: "/v2/core/accounts/{account_id}/persons/{id}"
      }),
      list: stripeMethod5({
        method: "GET",
        fullPath: "/v2/core/accounts/{account_id}/persons",
        methodType: "list"
      }),
      del: stripeMethod5({
        method: "DELETE",
        fullPath: "/v2/core/accounts/{account_id}/persons/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Accounts/PersonTokens.js
var stripeMethod6, PersonTokens;
var init_PersonTokens = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Accounts/PersonTokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod6 = StripeResource.method;
    PersonTokens = StripeResource.extend({
      create: stripeMethod6({
        method: "POST",
        fullPath: "/v2/core/accounts/{account_id}/person_tokens"
      }),
      retrieve: stripeMethod6({
        method: "GET",
        fullPath: "/v2/core/accounts/{account_id}/person_tokens/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Accounts.js
var stripeMethod7, Accounts2;
var init_Accounts2 = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Accounts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    init_Persons();
    init_PersonTokens();
    stripeMethod7 = StripeResource.method;
    Accounts2 = StripeResource.extend({
      constructor: /* @__PURE__ */ __name(function(...args) {
        StripeResource.apply(this, args);
        this.persons = new Persons(...args);
        this.personTokens = new PersonTokens(...args);
      }, "constructor"),
      create: stripeMethod7({ method: "POST", fullPath: "/v2/core/accounts" }),
      retrieve: stripeMethod7({ method: "GET", fullPath: "/v2/core/accounts/{id}" }),
      update: stripeMethod7({ method: "POST", fullPath: "/v2/core/accounts/{id}" }),
      list: stripeMethod7({
        method: "GET",
        fullPath: "/v2/core/accounts",
        methodType: "list"
      }),
      close: stripeMethod7({
        method: "POST",
        fullPath: "/v2/core/accounts/{id}/close"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Entitlements/ActiveEntitlements.js
var stripeMethod8, ActiveEntitlements;
var init_ActiveEntitlements = __esm({
  "../node_modules/stripe/esm/resources/Entitlements/ActiveEntitlements.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod8 = StripeResource.method;
    ActiveEntitlements = StripeResource.extend({
      retrieve: stripeMethod8({
        method: "GET",
        fullPath: "/v1/entitlements/active_entitlements/{id}"
      }),
      list: stripeMethod8({
        method: "GET",
        fullPath: "/v1/entitlements/active_entitlements",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/Alerts.js
var stripeMethod9, Alerts;
var init_Alerts = __esm({
  "../node_modules/stripe/esm/resources/Billing/Alerts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod9 = StripeResource.method;
    Alerts = StripeResource.extend({
      create: stripeMethod9({ method: "POST", fullPath: "/v1/billing/alerts" }),
      retrieve: stripeMethod9({ method: "GET", fullPath: "/v1/billing/alerts/{id}" }),
      list: stripeMethod9({
        method: "GET",
        fullPath: "/v1/billing/alerts",
        methodType: "list"
      }),
      activate: stripeMethod9({
        method: "POST",
        fullPath: "/v1/billing/alerts/{id}/activate"
      }),
      archive: stripeMethod9({
        method: "POST",
        fullPath: "/v1/billing/alerts/{id}/archive"
      }),
      deactivate: stripeMethod9({
        method: "POST",
        fullPath: "/v1/billing/alerts/{id}/deactivate"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Associations.js
var stripeMethod10, Associations;
var init_Associations = __esm({
  "../node_modules/stripe/esm/resources/Tax/Associations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod10 = StripeResource.method;
    Associations = StripeResource.extend({
      find: stripeMethod10({ method: "GET", fullPath: "/v1/tax/associations/find" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Authorizations.js
var stripeMethod11, Authorizations;
var init_Authorizations = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Authorizations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod11 = StripeResource.method;
    Authorizations = StripeResource.extend({
      retrieve: stripeMethod11({
        method: "GET",
        fullPath: "/v1/issuing/authorizations/{authorization}"
      }),
      update: stripeMethod11({
        method: "POST",
        fullPath: "/v1/issuing/authorizations/{authorization}"
      }),
      list: stripeMethod11({
        method: "GET",
        fullPath: "/v1/issuing/authorizations",
        methodType: "list"
      }),
      approve: stripeMethod11({
        method: "POST",
        fullPath: "/v1/issuing/authorizations/{authorization}/approve"
      }),
      decline: stripeMethod11({
        method: "POST",
        fullPath: "/v1/issuing/authorizations/{authorization}/decline"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/Authorizations.js
var stripeMethod12, Authorizations2;
var init_Authorizations2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/Authorizations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod12 = StripeResource.method;
    Authorizations2 = StripeResource.extend({
      create: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations"
      }),
      capture: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/capture"
      }),
      expire: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/expire"
      }),
      finalizeAmount: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/finalize_amount"
      }),
      increment: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/increment"
      }),
      respond: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/fraud_challenges/respond"
      }),
      reverse: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/reverse"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Calculations.js
var stripeMethod13, Calculations;
var init_Calculations = __esm({
  "../node_modules/stripe/esm/resources/Tax/Calculations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod13 = StripeResource.method;
    Calculations = StripeResource.extend({
      create: stripeMethod13({ method: "POST", fullPath: "/v1/tax/calculations" }),
      retrieve: stripeMethod13({
        method: "GET",
        fullPath: "/v1/tax/calculations/{calculation}"
      }),
      listLineItems: stripeMethod13({
        method: "GET",
        fullPath: "/v1/tax/calculations/{calculation}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Cardholders.js
var stripeMethod14, Cardholders;
var init_Cardholders = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Cardholders.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod14 = StripeResource.method;
    Cardholders = StripeResource.extend({
      create: stripeMethod14({ method: "POST", fullPath: "/v1/issuing/cardholders" }),
      retrieve: stripeMethod14({
        method: "GET",
        fullPath: "/v1/issuing/cardholders/{cardholder}"
      }),
      update: stripeMethod14({
        method: "POST",
        fullPath: "/v1/issuing/cardholders/{cardholder}"
      }),
      list: stripeMethod14({
        method: "GET",
        fullPath: "/v1/issuing/cardholders",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Cards.js
var stripeMethod15, Cards;
var init_Cards = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Cards.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod15 = StripeResource.method;
    Cards = StripeResource.extend({
      create: stripeMethod15({ method: "POST", fullPath: "/v1/issuing/cards" }),
      retrieve: stripeMethod15({ method: "GET", fullPath: "/v1/issuing/cards/{card}" }),
      update: stripeMethod15({ method: "POST", fullPath: "/v1/issuing/cards/{card}" }),
      list: stripeMethod15({
        method: "GET",
        fullPath: "/v1/issuing/cards",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/Cards.js
var stripeMethod16, Cards2;
var init_Cards2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/Cards.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod16 = StripeResource.method;
    Cards2 = StripeResource.extend({
      deliverCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/deliver"
      }),
      failCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/fail"
      }),
      returnCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/return"
      }),
      shipCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/ship"
      }),
      submitCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/submit"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/BillingPortal/Configurations.js
var stripeMethod17, Configurations;
var init_Configurations = __esm({
  "../node_modules/stripe/esm/resources/BillingPortal/Configurations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod17 = StripeResource.method;
    Configurations = StripeResource.extend({
      create: stripeMethod17({
        method: "POST",
        fullPath: "/v1/billing_portal/configurations"
      }),
      retrieve: stripeMethod17({
        method: "GET",
        fullPath: "/v1/billing_portal/configurations/{configuration}"
      }),
      update: stripeMethod17({
        method: "POST",
        fullPath: "/v1/billing_portal/configurations/{configuration}"
      }),
      list: stripeMethod17({
        method: "GET",
        fullPath: "/v1/billing_portal/configurations",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/Configurations.js
var stripeMethod18, Configurations2;
var init_Configurations2 = __esm({
  "../node_modules/stripe/esm/resources/Terminal/Configurations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod18 = StripeResource.method;
    Configurations2 = StripeResource.extend({
      create: stripeMethod18({
        method: "POST",
        fullPath: "/v1/terminal/configurations"
      }),
      retrieve: stripeMethod18({
        method: "GET",
        fullPath: "/v1/terminal/configurations/{configuration}"
      }),
      update: stripeMethod18({
        method: "POST",
        fullPath: "/v1/terminal/configurations/{configuration}"
      }),
      list: stripeMethod18({
        method: "GET",
        fullPath: "/v1/terminal/configurations",
        methodType: "list"
      }),
      del: stripeMethod18({
        method: "DELETE",
        fullPath: "/v1/terminal/configurations/{configuration}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/ConfirmationTokens.js
var stripeMethod19, ConfirmationTokens;
var init_ConfirmationTokens = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/ConfirmationTokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod19 = StripeResource.method;
    ConfirmationTokens = StripeResource.extend({
      create: stripeMethod19({
        method: "POST",
        fullPath: "/v1/test_helpers/confirmation_tokens"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/ConnectionTokens.js
var stripeMethod20, ConnectionTokens;
var init_ConnectionTokens = __esm({
  "../node_modules/stripe/esm/resources/Terminal/ConnectionTokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod20 = StripeResource.method;
    ConnectionTokens = StripeResource.extend({
      create: stripeMethod20({
        method: "POST",
        fullPath: "/v1/terminal/connection_tokens"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/CreditBalanceSummary.js
var stripeMethod21, CreditBalanceSummary;
var init_CreditBalanceSummary = __esm({
  "../node_modules/stripe/esm/resources/Billing/CreditBalanceSummary.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod21 = StripeResource.method;
    CreditBalanceSummary = StripeResource.extend({
      retrieve: stripeMethod21({
        method: "GET",
        fullPath: "/v1/billing/credit_balance_summary"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/CreditBalanceTransactions.js
var stripeMethod22, CreditBalanceTransactions;
var init_CreditBalanceTransactions = __esm({
  "../node_modules/stripe/esm/resources/Billing/CreditBalanceTransactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod22 = StripeResource.method;
    CreditBalanceTransactions = StripeResource.extend({
      retrieve: stripeMethod22({
        method: "GET",
        fullPath: "/v1/billing/credit_balance_transactions/{id}"
      }),
      list: stripeMethod22({
        method: "GET",
        fullPath: "/v1/billing/credit_balance_transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/CreditGrants.js
var stripeMethod23, CreditGrants;
var init_CreditGrants = __esm({
  "../node_modules/stripe/esm/resources/Billing/CreditGrants.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod23 = StripeResource.method;
    CreditGrants = StripeResource.extend({
      create: stripeMethod23({ method: "POST", fullPath: "/v1/billing/credit_grants" }),
      retrieve: stripeMethod23({
        method: "GET",
        fullPath: "/v1/billing/credit_grants/{id}"
      }),
      update: stripeMethod23({
        method: "POST",
        fullPath: "/v1/billing/credit_grants/{id}"
      }),
      list: stripeMethod23({
        method: "GET",
        fullPath: "/v1/billing/credit_grants",
        methodType: "list"
      }),
      expire: stripeMethod23({
        method: "POST",
        fullPath: "/v1/billing/credit_grants/{id}/expire"
      }),
      voidGrant: stripeMethod23({
        method: "POST",
        fullPath: "/v1/billing/credit_grants/{id}/void"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/CreditReversals.js
var stripeMethod24, CreditReversals;
var init_CreditReversals = __esm({
  "../node_modules/stripe/esm/resources/Treasury/CreditReversals.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod24 = StripeResource.method;
    CreditReversals = StripeResource.extend({
      create: stripeMethod24({
        method: "POST",
        fullPath: "/v1/treasury/credit_reversals"
      }),
      retrieve: stripeMethod24({
        method: "GET",
        fullPath: "/v1/treasury/credit_reversals/{credit_reversal}"
      }),
      list: stripeMethod24({
        method: "GET",
        fullPath: "/v1/treasury/credit_reversals",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Customers.js
var stripeMethod25, Customers;
var init_Customers = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Customers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod25 = StripeResource.method;
    Customers = StripeResource.extend({
      fundCashBalance: stripeMethod25({
        method: "POST",
        fullPath: "/v1/test_helpers/customers/{customer}/fund_cash_balance"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/DebitReversals.js
var stripeMethod26, DebitReversals;
var init_DebitReversals = __esm({
  "../node_modules/stripe/esm/resources/Treasury/DebitReversals.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod26 = StripeResource.method;
    DebitReversals = StripeResource.extend({
      create: stripeMethod26({
        method: "POST",
        fullPath: "/v1/treasury/debit_reversals"
      }),
      retrieve: stripeMethod26({
        method: "GET",
        fullPath: "/v1/treasury/debit_reversals/{debit_reversal}"
      }),
      list: stripeMethod26({
        method: "GET",
        fullPath: "/v1/treasury/debit_reversals",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Disputes.js
var stripeMethod27, Disputes;
var init_Disputes = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Disputes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod27 = StripeResource.method;
    Disputes = StripeResource.extend({
      create: stripeMethod27({ method: "POST", fullPath: "/v1/issuing/disputes" }),
      retrieve: stripeMethod27({
        method: "GET",
        fullPath: "/v1/issuing/disputes/{dispute}"
      }),
      update: stripeMethod27({
        method: "POST",
        fullPath: "/v1/issuing/disputes/{dispute}"
      }),
      list: stripeMethod27({
        method: "GET",
        fullPath: "/v1/issuing/disputes",
        methodType: "list"
      }),
      submit: stripeMethod27({
        method: "POST",
        fullPath: "/v1/issuing/disputes/{dispute}/submit"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/EarlyFraudWarnings.js
var stripeMethod28, EarlyFraudWarnings;
var init_EarlyFraudWarnings = __esm({
  "../node_modules/stripe/esm/resources/Radar/EarlyFraudWarnings.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod28 = StripeResource.method;
    EarlyFraudWarnings = StripeResource.extend({
      retrieve: stripeMethod28({
        method: "GET",
        fullPath: "/v1/radar/early_fraud_warnings/{early_fraud_warning}"
      }),
      list: stripeMethod28({
        method: "GET",
        fullPath: "/v1/radar/early_fraud_warnings",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/EventDestinations.js
var stripeMethod29, EventDestinations;
var init_EventDestinations = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/EventDestinations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod29 = StripeResource.method;
    EventDestinations = StripeResource.extend({
      create: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations"
      }),
      retrieve: stripeMethod29({
        method: "GET",
        fullPath: "/v2/core/event_destinations/{id}"
      }),
      update: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}"
      }),
      list: stripeMethod29({
        method: "GET",
        fullPath: "/v2/core/event_destinations",
        methodType: "list"
      }),
      del: stripeMethod29({
        method: "DELETE",
        fullPath: "/v2/core/event_destinations/{id}"
      }),
      disable: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}/disable"
      }),
      enable: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}/enable"
      }),
      ping: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}/ping"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Events.js
var stripeMethod30, Events;
var init_Events = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Events.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod30 = StripeResource.method;
    Events = StripeResource.extend({
      retrieve(...args) {
        const transformResponseData = /* @__PURE__ */ __name((response) => {
          return this.addFetchRelatedObjectIfNeeded(response);
        }, "transformResponseData");
        return stripeMethod30({
          method: "GET",
          fullPath: "/v2/core/events/{id}",
          transformResponseData
        }).apply(this, args);
      },
      list(...args) {
        const transformResponseData = /* @__PURE__ */ __name((response) => {
          return Object.assign(Object.assign({}, response), { data: response.data.map(this.addFetchRelatedObjectIfNeeded.bind(this)) });
        }, "transformResponseData");
        return stripeMethod30({
          method: "GET",
          fullPath: "/v2/core/events",
          methodType: "list",
          transformResponseData
        }).apply(this, args);
      },
      /**
       * @private
       *
       * For internal use in stripe-node.
       *
       * @param pulledEvent The retrieved event object
       * @returns The retrieved event object with a fetchRelatedObject method,
       * if pulledEvent.related_object is valid (non-null and has a url)
       */
      addFetchRelatedObjectIfNeeded(pulledEvent) {
        if (!pulledEvent.related_object || !pulledEvent.related_object.url) {
          return pulledEvent;
        }
        return Object.assign(Object.assign({}, pulledEvent), { fetchRelatedObject: /* @__PURE__ */ __name(() => (
          // call stripeMethod with 'this' resource to fetch
          // the related object. 'this' is needed to construct
          // and send the request, but the method spec controls
          // the url endpoint and method, so it doesn't matter
          // that 'this' is an Events resource object here
          stripeMethod30({
            method: "GET",
            fullPath: pulledEvent.related_object.url
          }).apply(this, [
            {
              stripeContext: pulledEvent.context
            }
          ])
        ), "fetchRelatedObject") });
      }
    });
  }
});

// ../node_modules/stripe/esm/resources/Entitlements/Features.js
var stripeMethod31, Features;
var init_Features = __esm({
  "../node_modules/stripe/esm/resources/Entitlements/Features.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod31 = StripeResource.method;
    Features = StripeResource.extend({
      create: stripeMethod31({ method: "POST", fullPath: "/v1/entitlements/features" }),
      retrieve: stripeMethod31({
        method: "GET",
        fullPath: "/v1/entitlements/features/{id}"
      }),
      update: stripeMethod31({
        method: "POST",
        fullPath: "/v1/entitlements/features/{id}"
      }),
      list: stripeMethod31({
        method: "GET",
        fullPath: "/v1/entitlements/features",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/FinancialAccounts.js
var stripeMethod32, FinancialAccounts;
var init_FinancialAccounts = __esm({
  "../node_modules/stripe/esm/resources/Treasury/FinancialAccounts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod32 = StripeResource.method;
    FinancialAccounts = StripeResource.extend({
      create: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts"
      }),
      retrieve: stripeMethod32({
        method: "GET",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}"
      }),
      update: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}"
      }),
      list: stripeMethod32({
        method: "GET",
        fullPath: "/v1/treasury/financial_accounts",
        methodType: "list"
      }),
      close: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}/close"
      }),
      retrieveFeatures: stripeMethod32({
        method: "GET",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}/features"
      }),
      updateFeatures: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}/features"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/InboundTransfers.js
var stripeMethod33, InboundTransfers;
var init_InboundTransfers = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/InboundTransfers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod33 = StripeResource.method;
    InboundTransfers = StripeResource.extend({
      fail: stripeMethod33({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/inbound_transfers/{id}/fail"
      }),
      returnInboundTransfer: stripeMethod33({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/inbound_transfers/{id}/return"
      }),
      succeed: stripeMethod33({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/inbound_transfers/{id}/succeed"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/InboundTransfers.js
var stripeMethod34, InboundTransfers2;
var init_InboundTransfers2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/InboundTransfers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod34 = StripeResource.method;
    InboundTransfers2 = StripeResource.extend({
      create: stripeMethod34({
        method: "POST",
        fullPath: "/v1/treasury/inbound_transfers"
      }),
      retrieve: stripeMethod34({
        method: "GET",
        fullPath: "/v1/treasury/inbound_transfers/{id}"
      }),
      list: stripeMethod34({
        method: "GET",
        fullPath: "/v1/treasury/inbound_transfers",
        methodType: "list"
      }),
      cancel: stripeMethod34({
        method: "POST",
        fullPath: "/v1/treasury/inbound_transfers/{inbound_transfer}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/Locations.js
var stripeMethod35, Locations;
var init_Locations = __esm({
  "../node_modules/stripe/esm/resources/Terminal/Locations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod35 = StripeResource.method;
    Locations = StripeResource.extend({
      create: stripeMethod35({ method: "POST", fullPath: "/v1/terminal/locations" }),
      retrieve: stripeMethod35({
        method: "GET",
        fullPath: "/v1/terminal/locations/{location}"
      }),
      update: stripeMethod35({
        method: "POST",
        fullPath: "/v1/terminal/locations/{location}"
      }),
      list: stripeMethod35({
        method: "GET",
        fullPath: "/v1/terminal/locations",
        methodType: "list"
      }),
      del: stripeMethod35({
        method: "DELETE",
        fullPath: "/v1/terminal/locations/{location}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/MeterEventAdjustments.js
var stripeMethod36, MeterEventAdjustments;
var init_MeterEventAdjustments = __esm({
  "../node_modules/stripe/esm/resources/Billing/MeterEventAdjustments.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod36 = StripeResource.method;
    MeterEventAdjustments = StripeResource.extend({
      create: stripeMethod36({
        method: "POST",
        fullPath: "/v1/billing/meter_event_adjustments"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEventAdjustments.js
var stripeMethod37, MeterEventAdjustments2;
var init_MeterEventAdjustments2 = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEventAdjustments.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod37 = StripeResource.method;
    MeterEventAdjustments2 = StripeResource.extend({
      create: stripeMethod37({
        method: "POST",
        fullPath: "/v2/billing/meter_event_adjustments"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEventSession.js
var stripeMethod38, MeterEventSession;
var init_MeterEventSession = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEventSession.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod38 = StripeResource.method;
    MeterEventSession = StripeResource.extend({
      create: stripeMethod38({
        method: "POST",
        fullPath: "/v2/billing/meter_event_session"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEventStream.js
var stripeMethod39, MeterEventStream;
var init_MeterEventStream = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEventStream.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod39 = StripeResource.method;
    MeterEventStream = StripeResource.extend({
      create: stripeMethod39({
        method: "POST",
        fullPath: "/v2/billing/meter_event_stream",
        host: "meter-events.stripe.com"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/MeterEvents.js
var stripeMethod40, MeterEvents;
var init_MeterEvents = __esm({
  "../node_modules/stripe/esm/resources/Billing/MeterEvents.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod40 = StripeResource.method;
    MeterEvents = StripeResource.extend({
      create: stripeMethod40({ method: "POST", fullPath: "/v1/billing/meter_events" })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEvents.js
var stripeMethod41, MeterEvents2;
var init_MeterEvents2 = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEvents.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod41 = StripeResource.method;
    MeterEvents2 = StripeResource.extend({
      create: stripeMethod41({ method: "POST", fullPath: "/v2/billing/meter_events" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/Meters.js
var stripeMethod42, Meters;
var init_Meters = __esm({
  "../node_modules/stripe/esm/resources/Billing/Meters.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod42 = StripeResource.method;
    Meters = StripeResource.extend({
      create: stripeMethod42({ method: "POST", fullPath: "/v1/billing/meters" }),
      retrieve: stripeMethod42({ method: "GET", fullPath: "/v1/billing/meters/{id}" }),
      update: stripeMethod42({ method: "POST", fullPath: "/v1/billing/meters/{id}" }),
      list: stripeMethod42({
        method: "GET",
        fullPath: "/v1/billing/meters",
        methodType: "list"
      }),
      deactivate: stripeMethod42({
        method: "POST",
        fullPath: "/v1/billing/meters/{id}/deactivate"
      }),
      listEventSummaries: stripeMethod42({
        method: "GET",
        fullPath: "/v1/billing/meters/{id}/event_summaries",
        methodType: "list"
      }),
      reactivate: stripeMethod42({
        method: "POST",
        fullPath: "/v1/billing/meters/{id}/reactivate"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/OnboardingLinks.js
var stripeMethod43, OnboardingLinks;
var init_OnboardingLinks = __esm({
  "../node_modules/stripe/esm/resources/Terminal/OnboardingLinks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod43 = StripeResource.method;
    OnboardingLinks = StripeResource.extend({
      create: stripeMethod43({
        method: "POST",
        fullPath: "/v1/terminal/onboarding_links"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Climate/Orders.js
var stripeMethod44, Orders;
var init_Orders = __esm({
  "../node_modules/stripe/esm/resources/Climate/Orders.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod44 = StripeResource.method;
    Orders = StripeResource.extend({
      create: stripeMethod44({ method: "POST", fullPath: "/v1/climate/orders" }),
      retrieve: stripeMethod44({
        method: "GET",
        fullPath: "/v1/climate/orders/{order}"
      }),
      update: stripeMethod44({
        method: "POST",
        fullPath: "/v1/climate/orders/{order}"
      }),
      list: stripeMethod44({
        method: "GET",
        fullPath: "/v1/climate/orders",
        methodType: "list"
      }),
      cancel: stripeMethod44({
        method: "POST",
        fullPath: "/v1/climate/orders/{order}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundPayments.js
var stripeMethod45, OutboundPayments;
var init_OutboundPayments = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundPayments.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod45 = StripeResource.method;
    OutboundPayments = StripeResource.extend({
      update: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}"
      }),
      fail: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}/fail"
      }),
      post: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}/post"
      }),
      returnOutboundPayment: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}/return"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/OutboundPayments.js
var stripeMethod46, OutboundPayments2;
var init_OutboundPayments2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/OutboundPayments.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod46 = StripeResource.method;
    OutboundPayments2 = StripeResource.extend({
      create: stripeMethod46({
        method: "POST",
        fullPath: "/v1/treasury/outbound_payments"
      }),
      retrieve: stripeMethod46({
        method: "GET",
        fullPath: "/v1/treasury/outbound_payments/{id}"
      }),
      list: stripeMethod46({
        method: "GET",
        fullPath: "/v1/treasury/outbound_payments",
        methodType: "list"
      }),
      cancel: stripeMethod46({
        method: "POST",
        fullPath: "/v1/treasury/outbound_payments/{id}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundTransfers.js
var stripeMethod47, OutboundTransfers;
var init_OutboundTransfers = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundTransfers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod47 = StripeResource.method;
    OutboundTransfers = StripeResource.extend({
      update: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}"
      }),
      fail: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/fail"
      }),
      post: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/post"
      }),
      returnOutboundTransfer: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/return"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/OutboundTransfers.js
var stripeMethod48, OutboundTransfers2;
var init_OutboundTransfers2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/OutboundTransfers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod48 = StripeResource.method;
    OutboundTransfers2 = StripeResource.extend({
      create: stripeMethod48({
        method: "POST",
        fullPath: "/v1/treasury/outbound_transfers"
      }),
      retrieve: stripeMethod48({
        method: "GET",
        fullPath: "/v1/treasury/outbound_transfers/{outbound_transfer}"
      }),
      list: stripeMethod48({
        method: "GET",
        fullPath: "/v1/treasury/outbound_transfers",
        methodType: "list"
      }),
      cancel: stripeMethod48({
        method: "POST",
        fullPath: "/v1/treasury/outbound_transfers/{outbound_transfer}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/PaymentEvaluations.js
var stripeMethod49, PaymentEvaluations;
var init_PaymentEvaluations = __esm({
  "../node_modules/stripe/esm/resources/Radar/PaymentEvaluations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod49 = StripeResource.method;
    PaymentEvaluations = StripeResource.extend({
      create: stripeMethod49({
        method: "POST",
        fullPath: "/v1/radar/payment_evaluations"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/PersonalizationDesigns.js
var stripeMethod50, PersonalizationDesigns;
var init_PersonalizationDesigns = __esm({
  "../node_modules/stripe/esm/resources/Issuing/PersonalizationDesigns.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod50 = StripeResource.method;
    PersonalizationDesigns = StripeResource.extend({
      create: stripeMethod50({
        method: "POST",
        fullPath: "/v1/issuing/personalization_designs"
      }),
      retrieve: stripeMethod50({
        method: "GET",
        fullPath: "/v1/issuing/personalization_designs/{personalization_design}"
      }),
      update: stripeMethod50({
        method: "POST",
        fullPath: "/v1/issuing/personalization_designs/{personalization_design}"
      }),
      list: stripeMethod50({
        method: "GET",
        fullPath: "/v1/issuing/personalization_designs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/PersonalizationDesigns.js
var stripeMethod51, PersonalizationDesigns2;
var init_PersonalizationDesigns2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/PersonalizationDesigns.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod51 = StripeResource.method;
    PersonalizationDesigns2 = StripeResource.extend({
      activate: stripeMethod51({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/personalization_designs/{personalization_design}/activate"
      }),
      deactivate: stripeMethod51({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/personalization_designs/{personalization_design}/deactivate"
      }),
      reject: stripeMethod51({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/PhysicalBundles.js
var stripeMethod52, PhysicalBundles;
var init_PhysicalBundles = __esm({
  "../node_modules/stripe/esm/resources/Issuing/PhysicalBundles.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod52 = StripeResource.method;
    PhysicalBundles = StripeResource.extend({
      retrieve: stripeMethod52({
        method: "GET",
        fullPath: "/v1/issuing/physical_bundles/{physical_bundle}"
      }),
      list: stripeMethod52({
        method: "GET",
        fullPath: "/v1/issuing/physical_bundles",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Climate/Products.js
var stripeMethod53, Products;
var init_Products = __esm({
  "../node_modules/stripe/esm/resources/Climate/Products.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod53 = StripeResource.method;
    Products = StripeResource.extend({
      retrieve: stripeMethod53({
        method: "GET",
        fullPath: "/v1/climate/products/{product}"
      }),
      list: stripeMethod53({
        method: "GET",
        fullPath: "/v1/climate/products",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/Readers.js
var stripeMethod54, Readers;
var init_Readers = __esm({
  "../node_modules/stripe/esm/resources/Terminal/Readers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod54 = StripeResource.method;
    Readers = StripeResource.extend({
      create: stripeMethod54({ method: "POST", fullPath: "/v1/terminal/readers" }),
      retrieve: stripeMethod54({
        method: "GET",
        fullPath: "/v1/terminal/readers/{reader}"
      }),
      update: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}"
      }),
      list: stripeMethod54({
        method: "GET",
        fullPath: "/v1/terminal/readers",
        methodType: "list"
      }),
      del: stripeMethod54({
        method: "DELETE",
        fullPath: "/v1/terminal/readers/{reader}"
      }),
      cancelAction: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/cancel_action"
      }),
      collectInputs: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/collect_inputs"
      }),
      collectPaymentMethod: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/collect_payment_method"
      }),
      confirmPaymentIntent: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/confirm_payment_intent"
      }),
      processPaymentIntent: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/process_payment_intent"
      }),
      processSetupIntent: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/process_setup_intent"
      }),
      refundPayment: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/refund_payment"
      }),
      setReaderDisplay: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/set_reader_display"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Terminal/Readers.js
var stripeMethod55, Readers2;
var init_Readers2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Terminal/Readers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod55 = StripeResource.method;
    Readers2 = StripeResource.extend({
      presentPaymentMethod: stripeMethod55({
        method: "POST",
        fullPath: "/v1/test_helpers/terminal/readers/{reader}/present_payment_method"
      }),
      succeedInputCollection: stripeMethod55({
        method: "POST",
        fullPath: "/v1/test_helpers/terminal/readers/{reader}/succeed_input_collection"
      }),
      timeoutInputCollection: stripeMethod55({
        method: "POST",
        fullPath: "/v1/test_helpers/terminal/readers/{reader}/timeout_input_collection"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedCredits.js
var stripeMethod56, ReceivedCredits;
var init_ReceivedCredits = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedCredits.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod56 = StripeResource.method;
    ReceivedCredits = StripeResource.extend({
      create: stripeMethod56({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/received_credits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/ReceivedCredits.js
var stripeMethod57, ReceivedCredits2;
var init_ReceivedCredits2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/ReceivedCredits.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod57 = StripeResource.method;
    ReceivedCredits2 = StripeResource.extend({
      retrieve: stripeMethod57({
        method: "GET",
        fullPath: "/v1/treasury/received_credits/{id}"
      }),
      list: stripeMethod57({
        method: "GET",
        fullPath: "/v1/treasury/received_credits",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedDebits.js
var stripeMethod58, ReceivedDebits;
var init_ReceivedDebits = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedDebits.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod58 = StripeResource.method;
    ReceivedDebits = StripeResource.extend({
      create: stripeMethod58({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/received_debits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/ReceivedDebits.js
var stripeMethod59, ReceivedDebits2;
var init_ReceivedDebits2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/ReceivedDebits.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod59 = StripeResource.method;
    ReceivedDebits2 = StripeResource.extend({
      retrieve: stripeMethod59({
        method: "GET",
        fullPath: "/v1/treasury/received_debits/{id}"
      }),
      list: stripeMethod59({
        method: "GET",
        fullPath: "/v1/treasury/received_debits",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Refunds.js
var stripeMethod60, Refunds;
var init_Refunds = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Refunds.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod60 = StripeResource.method;
    Refunds = StripeResource.extend({
      expire: stripeMethod60({
        method: "POST",
        fullPath: "/v1/test_helpers/refunds/{refund}/expire"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Registrations.js
var stripeMethod61, Registrations;
var init_Registrations = __esm({
  "../node_modules/stripe/esm/resources/Tax/Registrations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod61 = StripeResource.method;
    Registrations = StripeResource.extend({
      create: stripeMethod61({ method: "POST", fullPath: "/v1/tax/registrations" }),
      retrieve: stripeMethod61({
        method: "GET",
        fullPath: "/v1/tax/registrations/{id}"
      }),
      update: stripeMethod61({
        method: "POST",
        fullPath: "/v1/tax/registrations/{id}"
      }),
      list: stripeMethod61({
        method: "GET",
        fullPath: "/v1/tax/registrations",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Reporting/ReportRuns.js
var stripeMethod62, ReportRuns;
var init_ReportRuns = __esm({
  "../node_modules/stripe/esm/resources/Reporting/ReportRuns.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod62 = StripeResource.method;
    ReportRuns = StripeResource.extend({
      create: stripeMethod62({ method: "POST", fullPath: "/v1/reporting/report_runs" }),
      retrieve: stripeMethod62({
        method: "GET",
        fullPath: "/v1/reporting/report_runs/{report_run}"
      }),
      list: stripeMethod62({
        method: "GET",
        fullPath: "/v1/reporting/report_runs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Reporting/ReportTypes.js
var stripeMethod63, ReportTypes;
var init_ReportTypes = __esm({
  "../node_modules/stripe/esm/resources/Reporting/ReportTypes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod63 = StripeResource.method;
    ReportTypes = StripeResource.extend({
      retrieve: stripeMethod63({
        method: "GET",
        fullPath: "/v1/reporting/report_types/{report_type}"
      }),
      list: stripeMethod63({
        method: "GET",
        fullPath: "/v1/reporting/report_types",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Forwarding/Requests.js
var stripeMethod64, Requests;
var init_Requests = __esm({
  "../node_modules/stripe/esm/resources/Forwarding/Requests.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod64 = StripeResource.method;
    Requests = StripeResource.extend({
      create: stripeMethod64({ method: "POST", fullPath: "/v1/forwarding/requests" }),
      retrieve: stripeMethod64({
        method: "GET",
        fullPath: "/v1/forwarding/requests/{id}"
      }),
      list: stripeMethod64({
        method: "GET",
        fullPath: "/v1/forwarding/requests",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Sigma/ScheduledQueryRuns.js
var stripeMethod65, ScheduledQueryRuns;
var init_ScheduledQueryRuns = __esm({
  "../node_modules/stripe/esm/resources/Sigma/ScheduledQueryRuns.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod65 = StripeResource.method;
    ScheduledQueryRuns = StripeResource.extend({
      retrieve: stripeMethod65({
        method: "GET",
        fullPath: "/v1/sigma/scheduled_query_runs/{scheduled_query_run}"
      }),
      list: stripeMethod65({
        method: "GET",
        fullPath: "/v1/sigma/scheduled_query_runs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Apps/Secrets.js
var stripeMethod66, Secrets;
var init_Secrets = __esm({
  "../node_modules/stripe/esm/resources/Apps/Secrets.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod66 = StripeResource.method;
    Secrets = StripeResource.extend({
      create: stripeMethod66({ method: "POST", fullPath: "/v1/apps/secrets" }),
      list: stripeMethod66({
        method: "GET",
        fullPath: "/v1/apps/secrets",
        methodType: "list"
      }),
      deleteWhere: stripeMethod66({
        method: "POST",
        fullPath: "/v1/apps/secrets/delete"
      }),
      find: stripeMethod66({ method: "GET", fullPath: "/v1/apps/secrets/find" })
    });
  }
});

// ../node_modules/stripe/esm/resources/BillingPortal/Sessions.js
var stripeMethod67, Sessions;
var init_Sessions = __esm({
  "../node_modules/stripe/esm/resources/BillingPortal/Sessions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod67 = StripeResource.method;
    Sessions = StripeResource.extend({
      create: stripeMethod67({
        method: "POST",
        fullPath: "/v1/billing_portal/sessions"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Checkout/Sessions.js
var stripeMethod68, Sessions2;
var init_Sessions2 = __esm({
  "../node_modules/stripe/esm/resources/Checkout/Sessions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod68 = StripeResource.method;
    Sessions2 = StripeResource.extend({
      create: stripeMethod68({ method: "POST", fullPath: "/v1/checkout/sessions" }),
      retrieve: stripeMethod68({
        method: "GET",
        fullPath: "/v1/checkout/sessions/{session}"
      }),
      update: stripeMethod68({
        method: "POST",
        fullPath: "/v1/checkout/sessions/{session}"
      }),
      list: stripeMethod68({
        method: "GET",
        fullPath: "/v1/checkout/sessions",
        methodType: "list"
      }),
      expire: stripeMethod68({
        method: "POST",
        fullPath: "/v1/checkout/sessions/{session}/expire"
      }),
      listLineItems: stripeMethod68({
        method: "GET",
        fullPath: "/v1/checkout/sessions/{session}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FinancialConnections/Sessions.js
var stripeMethod69, Sessions3;
var init_Sessions3 = __esm({
  "../node_modules/stripe/esm/resources/FinancialConnections/Sessions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod69 = StripeResource.method;
    Sessions3 = StripeResource.extend({
      create: stripeMethod69({
        method: "POST",
        fullPath: "/v1/financial_connections/sessions"
      }),
      retrieve: stripeMethod69({
        method: "GET",
        fullPath: "/v1/financial_connections/sessions/{session}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Settings.js
var stripeMethod70, Settings;
var init_Settings = __esm({
  "../node_modules/stripe/esm/resources/Tax/Settings.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod70 = StripeResource.method;
    Settings = StripeResource.extend({
      retrieve: stripeMethod70({ method: "GET", fullPath: "/v1/tax/settings" }),
      update: stripeMethod70({ method: "POST", fullPath: "/v1/tax/settings" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Climate/Suppliers.js
var stripeMethod71, Suppliers;
var init_Suppliers = __esm({
  "../node_modules/stripe/esm/resources/Climate/Suppliers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod71 = StripeResource.method;
    Suppliers = StripeResource.extend({
      retrieve: stripeMethod71({
        method: "GET",
        fullPath: "/v1/climate/suppliers/{supplier}"
      }),
      list: stripeMethod71({
        method: "GET",
        fullPath: "/v1/climate/suppliers",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/TestClocks.js
var stripeMethod72, TestClocks;
var init_TestClocks = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/TestClocks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod72 = StripeResource.method;
    TestClocks = StripeResource.extend({
      create: stripeMethod72({
        method: "POST",
        fullPath: "/v1/test_helpers/test_clocks"
      }),
      retrieve: stripeMethod72({
        method: "GET",
        fullPath: "/v1/test_helpers/test_clocks/{test_clock}"
      }),
      list: stripeMethod72({
        method: "GET",
        fullPath: "/v1/test_helpers/test_clocks",
        methodType: "list"
      }),
      del: stripeMethod72({
        method: "DELETE",
        fullPath: "/v1/test_helpers/test_clocks/{test_clock}"
      }),
      advance: stripeMethod72({
        method: "POST",
        fullPath: "/v1/test_helpers/test_clocks/{test_clock}/advance"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Tokens.js
var stripeMethod73, Tokens;
var init_Tokens = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Tokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod73 = StripeResource.method;
    Tokens = StripeResource.extend({
      retrieve: stripeMethod73({
        method: "GET",
        fullPath: "/v1/issuing/tokens/{token}"
      }),
      update: stripeMethod73({
        method: "POST",
        fullPath: "/v1/issuing/tokens/{token}"
      }),
      list: stripeMethod73({
        method: "GET",
        fullPath: "/v1/issuing/tokens",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/TransactionEntries.js
var stripeMethod74, TransactionEntries;
var init_TransactionEntries = __esm({
  "../node_modules/stripe/esm/resources/Treasury/TransactionEntries.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod74 = StripeResource.method;
    TransactionEntries = StripeResource.extend({
      retrieve: stripeMethod74({
        method: "GET",
        fullPath: "/v1/treasury/transaction_entries/{id}"
      }),
      list: stripeMethod74({
        method: "GET",
        fullPath: "/v1/treasury/transaction_entries",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FinancialConnections/Transactions.js
var stripeMethod75, Transactions;
var init_Transactions = __esm({
  "../node_modules/stripe/esm/resources/FinancialConnections/Transactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod75 = StripeResource.method;
    Transactions = StripeResource.extend({
      retrieve: stripeMethod75({
        method: "GET",
        fullPath: "/v1/financial_connections/transactions/{transaction}"
      }),
      list: stripeMethod75({
        method: "GET",
        fullPath: "/v1/financial_connections/transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Transactions.js
var stripeMethod76, Transactions2;
var init_Transactions2 = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Transactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod76 = StripeResource.method;
    Transactions2 = StripeResource.extend({
      retrieve: stripeMethod76({
        method: "GET",
        fullPath: "/v1/issuing/transactions/{transaction}"
      }),
      update: stripeMethod76({
        method: "POST",
        fullPath: "/v1/issuing/transactions/{transaction}"
      }),
      list: stripeMethod76({
        method: "GET",
        fullPath: "/v1/issuing/transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Transactions.js
var stripeMethod77, Transactions3;
var init_Transactions3 = __esm({
  "../node_modules/stripe/esm/resources/Tax/Transactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod77 = StripeResource.method;
    Transactions3 = StripeResource.extend({
      retrieve: stripeMethod77({
        method: "GET",
        fullPath: "/v1/tax/transactions/{transaction}"
      }),
      createFromCalculation: stripeMethod77({
        method: "POST",
        fullPath: "/v1/tax/transactions/create_from_calculation"
      }),
      createReversal: stripeMethod77({
        method: "POST",
        fullPath: "/v1/tax/transactions/create_reversal"
      }),
      listLineItems: stripeMethod77({
        method: "GET",
        fullPath: "/v1/tax/transactions/{transaction}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/Transactions.js
var stripeMethod78, Transactions4;
var init_Transactions4 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/Transactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod78 = StripeResource.method;
    Transactions4 = StripeResource.extend({
      createForceCapture: stripeMethod78({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/transactions/create_force_capture"
      }),
      createUnlinkedRefund: stripeMethod78({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/transactions/create_unlinked_refund"
      }),
      refund: stripeMethod78({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/transactions/{transaction}/refund"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/Transactions.js
var stripeMethod79, Transactions5;
var init_Transactions5 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/Transactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod79 = StripeResource.method;
    Transactions5 = StripeResource.extend({
      retrieve: stripeMethod79({
        method: "GET",
        fullPath: "/v1/treasury/transactions/{id}"
      }),
      list: stripeMethod79({
        method: "GET",
        fullPath: "/v1/treasury/transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/ValueListItems.js
var stripeMethod80, ValueListItems;
var init_ValueListItems = __esm({
  "../node_modules/stripe/esm/resources/Radar/ValueListItems.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod80 = StripeResource.method;
    ValueListItems = StripeResource.extend({
      create: stripeMethod80({
        method: "POST",
        fullPath: "/v1/radar/value_list_items"
      }),
      retrieve: stripeMethod80({
        method: "GET",
        fullPath: "/v1/radar/value_list_items/{item}"
      }),
      list: stripeMethod80({
        method: "GET",
        fullPath: "/v1/radar/value_list_items",
        methodType: "list"
      }),
      del: stripeMethod80({
        method: "DELETE",
        fullPath: "/v1/radar/value_list_items/{item}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/ValueLists.js
var stripeMethod81, ValueLists;
var init_ValueLists = __esm({
  "../node_modules/stripe/esm/resources/Radar/ValueLists.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod81 = StripeResource.method;
    ValueLists = StripeResource.extend({
      create: stripeMethod81({ method: "POST", fullPath: "/v1/radar/value_lists" }),
      retrieve: stripeMethod81({
        method: "GET",
        fullPath: "/v1/radar/value_lists/{value_list}"
      }),
      update: stripeMethod81({
        method: "POST",
        fullPath: "/v1/radar/value_lists/{value_list}"
      }),
      list: stripeMethod81({
        method: "GET",
        fullPath: "/v1/radar/value_lists",
        methodType: "list"
      }),
      del: stripeMethod81({
        method: "DELETE",
        fullPath: "/v1/radar/value_lists/{value_list}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Identity/VerificationReports.js
var stripeMethod82, VerificationReports;
var init_VerificationReports = __esm({
  "../node_modules/stripe/esm/resources/Identity/VerificationReports.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod82 = StripeResource.method;
    VerificationReports = StripeResource.extend({
      retrieve: stripeMethod82({
        method: "GET",
        fullPath: "/v1/identity/verification_reports/{report}"
      }),
      list: stripeMethod82({
        method: "GET",
        fullPath: "/v1/identity/verification_reports",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Identity/VerificationSessions.js
var stripeMethod83, VerificationSessions;
var init_VerificationSessions = __esm({
  "../node_modules/stripe/esm/resources/Identity/VerificationSessions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod83 = StripeResource.method;
    VerificationSessions = StripeResource.extend({
      create: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions"
      }),
      retrieve: stripeMethod83({
        method: "GET",
        fullPath: "/v1/identity/verification_sessions/{session}"
      }),
      update: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions/{session}"
      }),
      list: stripeMethod83({
        method: "GET",
        fullPath: "/v1/identity/verification_sessions",
        methodType: "list"
      }),
      cancel: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions/{session}/cancel"
      }),
      redact: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions/{session}/redact"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Accounts.js
var stripeMethod84, Accounts3;
var init_Accounts3 = __esm({
  "../node_modules/stripe/esm/resources/Accounts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod84 = StripeResource.method;
    Accounts3 = StripeResource.extend({
      create: stripeMethod84({ method: "POST", fullPath: "/v1/accounts" }),
      retrieve(id, ...args) {
        if (typeof id === "string") {
          return stripeMethod84({
            method: "GET",
            fullPath: "/v1/accounts/{id}"
          }).apply(this, [id, ...args]);
        } else {
          if (id === null || id === void 0) {
            [].shift.apply([id, ...args]);
          }
          return stripeMethod84({
            method: "GET",
            fullPath: "/v1/account"
          }).apply(this, [id, ...args]);
        }
      },
      update: stripeMethod84({ method: "POST", fullPath: "/v1/accounts/{account}" }),
      list: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts",
        methodType: "list"
      }),
      del: stripeMethod84({ method: "DELETE", fullPath: "/v1/accounts/{account}" }),
      createExternalAccount: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/external_accounts"
      }),
      createLoginLink: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/login_links"
      }),
      createPerson: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/persons"
      }),
      deleteExternalAccount: stripeMethod84({
        method: "DELETE",
        fullPath: "/v1/accounts/{account}/external_accounts/{id}"
      }),
      deletePerson: stripeMethod84({
        method: "DELETE",
        fullPath: "/v1/accounts/{account}/persons/{person}"
      }),
      listCapabilities: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/capabilities",
        methodType: "list"
      }),
      listExternalAccounts: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/external_accounts",
        methodType: "list"
      }),
      listPersons: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/persons",
        methodType: "list"
      }),
      reject: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/reject"
      }),
      retrieveCurrent: stripeMethod84({ method: "GET", fullPath: "/v1/account" }),
      retrieveCapability: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/capabilities/{capability}"
      }),
      retrieveExternalAccount: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/external_accounts/{id}"
      }),
      retrievePerson: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/persons/{person}"
      }),
      updateCapability: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/capabilities/{capability}"
      }),
      updateExternalAccount: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/external_accounts/{id}"
      }),
      updatePerson: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/persons/{person}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/AccountLinks.js
var stripeMethod85, AccountLinks2;
var init_AccountLinks2 = __esm({
  "../node_modules/stripe/esm/resources/AccountLinks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod85 = StripeResource.method;
    AccountLinks2 = StripeResource.extend({
      create: stripeMethod85({ method: "POST", fullPath: "/v1/account_links" })
    });
  }
});

// ../node_modules/stripe/esm/resources/AccountSessions.js
var stripeMethod86, AccountSessions;
var init_AccountSessions = __esm({
  "../node_modules/stripe/esm/resources/AccountSessions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod86 = StripeResource.method;
    AccountSessions = StripeResource.extend({
      create: stripeMethod86({ method: "POST", fullPath: "/v1/account_sessions" })
    });
  }
});

// ../node_modules/stripe/esm/resources/ApplePayDomains.js
var stripeMethod87, ApplePayDomains;
var init_ApplePayDomains = __esm({
  "../node_modules/stripe/esm/resources/ApplePayDomains.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod87 = StripeResource.method;
    ApplePayDomains = StripeResource.extend({
      create: stripeMethod87({ method: "POST", fullPath: "/v1/apple_pay/domains" }),
      retrieve: stripeMethod87({
        method: "GET",
        fullPath: "/v1/apple_pay/domains/{domain}"
      }),
      list: stripeMethod87({
        method: "GET",
        fullPath: "/v1/apple_pay/domains",
        methodType: "list"
      }),
      del: stripeMethod87({
        method: "DELETE",
        fullPath: "/v1/apple_pay/domains/{domain}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ApplicationFees.js
var stripeMethod88, ApplicationFees;
var init_ApplicationFees = __esm({
  "../node_modules/stripe/esm/resources/ApplicationFees.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod88 = StripeResource.method;
    ApplicationFees = StripeResource.extend({
      retrieve: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees/{id}"
      }),
      list: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees",
        methodType: "list"
      }),
      createRefund: stripeMethod88({
        method: "POST",
        fullPath: "/v1/application_fees/{id}/refunds"
      }),
      listRefunds: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees/{id}/refunds",
        methodType: "list"
      }),
      retrieveRefund: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees/{fee}/refunds/{id}"
      }),
      updateRefund: stripeMethod88({
        method: "POST",
        fullPath: "/v1/application_fees/{fee}/refunds/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Balance.js
var stripeMethod89, Balance;
var init_Balance = __esm({
  "../node_modules/stripe/esm/resources/Balance.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod89 = StripeResource.method;
    Balance = StripeResource.extend({
      retrieve: stripeMethod89({ method: "GET", fullPath: "/v1/balance" })
    });
  }
});

// ../node_modules/stripe/esm/resources/BalanceSettings.js
var stripeMethod90, BalanceSettings;
var init_BalanceSettings = __esm({
  "../node_modules/stripe/esm/resources/BalanceSettings.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod90 = StripeResource.method;
    BalanceSettings = StripeResource.extend({
      retrieve: stripeMethod90({ method: "GET", fullPath: "/v1/balance_settings" }),
      update: stripeMethod90({ method: "POST", fullPath: "/v1/balance_settings" })
    });
  }
});

// ../node_modules/stripe/esm/resources/BalanceTransactions.js
var stripeMethod91, BalanceTransactions;
var init_BalanceTransactions = __esm({
  "../node_modules/stripe/esm/resources/BalanceTransactions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod91 = StripeResource.method;
    BalanceTransactions = StripeResource.extend({
      retrieve: stripeMethod91({
        method: "GET",
        fullPath: "/v1/balance_transactions/{id}"
      }),
      list: stripeMethod91({
        method: "GET",
        fullPath: "/v1/balance_transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Charges.js
var stripeMethod92, Charges;
var init_Charges = __esm({
  "../node_modules/stripe/esm/resources/Charges.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod92 = StripeResource.method;
    Charges = StripeResource.extend({
      create: stripeMethod92({ method: "POST", fullPath: "/v1/charges" }),
      retrieve: stripeMethod92({ method: "GET", fullPath: "/v1/charges/{charge}" }),
      update: stripeMethod92({ method: "POST", fullPath: "/v1/charges/{charge}" }),
      list: stripeMethod92({
        method: "GET",
        fullPath: "/v1/charges",
        methodType: "list"
      }),
      capture: stripeMethod92({
        method: "POST",
        fullPath: "/v1/charges/{charge}/capture"
      }),
      search: stripeMethod92({
        method: "GET",
        fullPath: "/v1/charges/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ConfirmationTokens.js
var stripeMethod93, ConfirmationTokens2;
var init_ConfirmationTokens2 = __esm({
  "../node_modules/stripe/esm/resources/ConfirmationTokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod93 = StripeResource.method;
    ConfirmationTokens2 = StripeResource.extend({
      retrieve: stripeMethod93({
        method: "GET",
        fullPath: "/v1/confirmation_tokens/{confirmation_token}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/CountrySpecs.js
var stripeMethod94, CountrySpecs;
var init_CountrySpecs = __esm({
  "../node_modules/stripe/esm/resources/CountrySpecs.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod94 = StripeResource.method;
    CountrySpecs = StripeResource.extend({
      retrieve: stripeMethod94({
        method: "GET",
        fullPath: "/v1/country_specs/{country}"
      }),
      list: stripeMethod94({
        method: "GET",
        fullPath: "/v1/country_specs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Coupons.js
var stripeMethod95, Coupons;
var init_Coupons = __esm({
  "../node_modules/stripe/esm/resources/Coupons.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod95 = StripeResource.method;
    Coupons = StripeResource.extend({
      create: stripeMethod95({ method: "POST", fullPath: "/v1/coupons" }),
      retrieve: stripeMethod95({ method: "GET", fullPath: "/v1/coupons/{coupon}" }),
      update: stripeMethod95({ method: "POST", fullPath: "/v1/coupons/{coupon}" }),
      list: stripeMethod95({
        method: "GET",
        fullPath: "/v1/coupons",
        methodType: "list"
      }),
      del: stripeMethod95({ method: "DELETE", fullPath: "/v1/coupons/{coupon}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/CreditNotes.js
var stripeMethod96, CreditNotes;
var init_CreditNotes = __esm({
  "../node_modules/stripe/esm/resources/CreditNotes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod96 = StripeResource.method;
    CreditNotes = StripeResource.extend({
      create: stripeMethod96({ method: "POST", fullPath: "/v1/credit_notes" }),
      retrieve: stripeMethod96({ method: "GET", fullPath: "/v1/credit_notes/{id}" }),
      update: stripeMethod96({ method: "POST", fullPath: "/v1/credit_notes/{id}" }),
      list: stripeMethod96({
        method: "GET",
        fullPath: "/v1/credit_notes",
        methodType: "list"
      }),
      listLineItems: stripeMethod96({
        method: "GET",
        fullPath: "/v1/credit_notes/{credit_note}/lines",
        methodType: "list"
      }),
      listPreviewLineItems: stripeMethod96({
        method: "GET",
        fullPath: "/v1/credit_notes/preview/lines",
        methodType: "list"
      }),
      preview: stripeMethod96({ method: "GET", fullPath: "/v1/credit_notes/preview" }),
      voidCreditNote: stripeMethod96({
        method: "POST",
        fullPath: "/v1/credit_notes/{id}/void"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/CustomerSessions.js
var stripeMethod97, CustomerSessions;
var init_CustomerSessions = __esm({
  "../node_modules/stripe/esm/resources/CustomerSessions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod97 = StripeResource.method;
    CustomerSessions = StripeResource.extend({
      create: stripeMethod97({ method: "POST", fullPath: "/v1/customer_sessions" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Customers.js
var stripeMethod98, Customers2;
var init_Customers2 = __esm({
  "../node_modules/stripe/esm/resources/Customers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod98 = StripeResource.method;
    Customers2 = StripeResource.extend({
      create: stripeMethod98({ method: "POST", fullPath: "/v1/customers" }),
      retrieve: stripeMethod98({ method: "GET", fullPath: "/v1/customers/{customer}" }),
      update: stripeMethod98({ method: "POST", fullPath: "/v1/customers/{customer}" }),
      list: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers",
        methodType: "list"
      }),
      del: stripeMethod98({ method: "DELETE", fullPath: "/v1/customers/{customer}" }),
      createBalanceTransaction: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/balance_transactions"
      }),
      createFundingInstructions: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/funding_instructions"
      }),
      createSource: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/sources"
      }),
      createTaxId: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/tax_ids"
      }),
      deleteDiscount: stripeMethod98({
        method: "DELETE",
        fullPath: "/v1/customers/{customer}/discount"
      }),
      deleteSource: stripeMethod98({
        method: "DELETE",
        fullPath: "/v1/customers/{customer}/sources/{id}"
      }),
      deleteTaxId: stripeMethod98({
        method: "DELETE",
        fullPath: "/v1/customers/{customer}/tax_ids/{id}"
      }),
      listBalanceTransactions: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/balance_transactions",
        methodType: "list"
      }),
      listCashBalanceTransactions: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/cash_balance_transactions",
        methodType: "list"
      }),
      listPaymentMethods: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/payment_methods",
        methodType: "list"
      }),
      listSources: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/sources",
        methodType: "list"
      }),
      listTaxIds: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/tax_ids",
        methodType: "list"
      }),
      retrieveBalanceTransaction: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/balance_transactions/{transaction}"
      }),
      retrieveCashBalance: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/cash_balance"
      }),
      retrieveCashBalanceTransaction: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/cash_balance_transactions/{transaction}"
      }),
      retrievePaymentMethod: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/payment_methods/{payment_method}"
      }),
      retrieveSource: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/sources/{id}"
      }),
      retrieveTaxId: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/tax_ids/{id}"
      }),
      search: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/search",
        methodType: "search"
      }),
      updateBalanceTransaction: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/balance_transactions/{transaction}"
      }),
      updateCashBalance: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/cash_balance"
      }),
      updateSource: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/sources/{id}"
      }),
      verifySource: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/sources/{id}/verify"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Disputes.js
var stripeMethod99, Disputes2;
var init_Disputes2 = __esm({
  "../node_modules/stripe/esm/resources/Disputes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod99 = StripeResource.method;
    Disputes2 = StripeResource.extend({
      retrieve: stripeMethod99({ method: "GET", fullPath: "/v1/disputes/{dispute}" }),
      update: stripeMethod99({ method: "POST", fullPath: "/v1/disputes/{dispute}" }),
      list: stripeMethod99({
        method: "GET",
        fullPath: "/v1/disputes",
        methodType: "list"
      }),
      close: stripeMethod99({
        method: "POST",
        fullPath: "/v1/disputes/{dispute}/close"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/EphemeralKeys.js
var stripeMethod100, EphemeralKeys;
var init_EphemeralKeys = __esm({
  "../node_modules/stripe/esm/resources/EphemeralKeys.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod100 = StripeResource.method;
    EphemeralKeys = StripeResource.extend({
      create: stripeMethod100({
        method: "POST",
        fullPath: "/v1/ephemeral_keys",
        validator: /* @__PURE__ */ __name((data, options) => {
          if (!options.headers || !options.headers["Stripe-Version"]) {
            throw new Error("Passing apiVersion in a separate options hash is required to create an ephemeral key. See https://stripe.com/docs/api/versioning?lang=node");
          }
        }, "validator")
      }),
      del: stripeMethod100({ method: "DELETE", fullPath: "/v1/ephemeral_keys/{key}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Events.js
var stripeMethod101, Events2;
var init_Events2 = __esm({
  "../node_modules/stripe/esm/resources/Events.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod101 = StripeResource.method;
    Events2 = StripeResource.extend({
      retrieve: stripeMethod101({ method: "GET", fullPath: "/v1/events/{id}" }),
      list: stripeMethod101({
        method: "GET",
        fullPath: "/v1/events",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ExchangeRates.js
var stripeMethod102, ExchangeRates;
var init_ExchangeRates = __esm({
  "../node_modules/stripe/esm/resources/ExchangeRates.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod102 = StripeResource.method;
    ExchangeRates = StripeResource.extend({
      retrieve: stripeMethod102({
        method: "GET",
        fullPath: "/v1/exchange_rates/{rate_id}"
      }),
      list: stripeMethod102({
        method: "GET",
        fullPath: "/v1/exchange_rates",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FileLinks.js
var stripeMethod103, FileLinks;
var init_FileLinks = __esm({
  "../node_modules/stripe/esm/resources/FileLinks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod103 = StripeResource.method;
    FileLinks = StripeResource.extend({
      create: stripeMethod103({ method: "POST", fullPath: "/v1/file_links" }),
      retrieve: stripeMethod103({ method: "GET", fullPath: "/v1/file_links/{link}" }),
      update: stripeMethod103({ method: "POST", fullPath: "/v1/file_links/{link}" }),
      list: stripeMethod103({
        method: "GET",
        fullPath: "/v1/file_links",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/multipart.js
function multipartRequestDataProcessor(method, data, headers, callback) {
  data = data || {};
  if (method !== "POST") {
    return callback(null, queryStringifyRequestData(data));
  }
  this._stripe._platformFunctions.tryBufferData(data).then((bufferedData) => {
    const buffer = multipartDataGenerator(method, bufferedData, headers);
    return callback(null, buffer);
  }).catch((err) => callback(err, null));
}
var multipartDataGenerator;
var init_multipart = __esm({
  "../node_modules/stripe/esm/multipart.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_utils();
    multipartDataGenerator = /* @__PURE__ */ __name((method, data, headers) => {
      const segno = (Math.round(Math.random() * 1e16) + Math.round(Math.random() * 1e16)).toString();
      headers["Content-Type"] = `multipart/form-data; boundary=${segno}`;
      const textEncoder = new TextEncoder();
      let buffer = new Uint8Array(0);
      const endBuffer = textEncoder.encode("\r\n");
      function push(l) {
        const prevBuffer = buffer;
        const newBuffer = l instanceof Uint8Array ? l : new Uint8Array(textEncoder.encode(l));
        buffer = new Uint8Array(prevBuffer.length + newBuffer.length + 2);
        buffer.set(prevBuffer);
        buffer.set(newBuffer, prevBuffer.length);
        buffer.set(endBuffer, buffer.length - 2);
      }
      __name(push, "push");
      function q(s) {
        return `"${s.replace(/"|"/g, "%22").replace(/\r\n|\r|\n/g, " ")}"`;
      }
      __name(q, "q");
      const flattenedData = flattenAndStringify(data);
      for (const k in flattenedData) {
        if (!Object.prototype.hasOwnProperty.call(flattenedData, k)) {
          continue;
        }
        const v = flattenedData[k];
        push(`--${segno}`);
        if (Object.prototype.hasOwnProperty.call(v, "data")) {
          const typedEntry = v;
          push(`Content-Disposition: form-data; name=${q(k)}; filename=${q(typedEntry.name || "blob")}`);
          push(`Content-Type: ${typedEntry.type || "application/octet-stream"}`);
          push("");
          push(typedEntry.data);
        } else {
          push(`Content-Disposition: form-data; name=${q(k)}`);
          push("");
          push(v);
        }
      }
      push(`--${segno}--`);
      return buffer;
    }, "multipartDataGenerator");
    __name(multipartRequestDataProcessor, "multipartRequestDataProcessor");
  }
});

// ../node_modules/stripe/esm/resources/Files.js
var stripeMethod104, Files;
var init_Files = __esm({
  "../node_modules/stripe/esm/resources/Files.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_multipart();
    init_StripeResource();
    stripeMethod104 = StripeResource.method;
    Files = StripeResource.extend({
      create: stripeMethod104({
        method: "POST",
        fullPath: "/v1/files",
        headers: {
          "Content-Type": "multipart/form-data"
        },
        host: "files.stripe.com"
      }),
      retrieve: stripeMethod104({ method: "GET", fullPath: "/v1/files/{file}" }),
      list: stripeMethod104({
        method: "GET",
        fullPath: "/v1/files",
        methodType: "list"
      }),
      requestDataProcessor: multipartRequestDataProcessor
    });
  }
});

// ../node_modules/stripe/esm/resources/InvoiceItems.js
var stripeMethod105, InvoiceItems;
var init_InvoiceItems = __esm({
  "../node_modules/stripe/esm/resources/InvoiceItems.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod105 = StripeResource.method;
    InvoiceItems = StripeResource.extend({
      create: stripeMethod105({ method: "POST", fullPath: "/v1/invoiceitems" }),
      retrieve: stripeMethod105({
        method: "GET",
        fullPath: "/v1/invoiceitems/{invoiceitem}"
      }),
      update: stripeMethod105({
        method: "POST",
        fullPath: "/v1/invoiceitems/{invoiceitem}"
      }),
      list: stripeMethod105({
        method: "GET",
        fullPath: "/v1/invoiceitems",
        methodType: "list"
      }),
      del: stripeMethod105({
        method: "DELETE",
        fullPath: "/v1/invoiceitems/{invoiceitem}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/InvoicePayments.js
var stripeMethod106, InvoicePayments;
var init_InvoicePayments = __esm({
  "../node_modules/stripe/esm/resources/InvoicePayments.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod106 = StripeResource.method;
    InvoicePayments = StripeResource.extend({
      retrieve: stripeMethod106({
        method: "GET",
        fullPath: "/v1/invoice_payments/{invoice_payment}"
      }),
      list: stripeMethod106({
        method: "GET",
        fullPath: "/v1/invoice_payments",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/InvoiceRenderingTemplates.js
var stripeMethod107, InvoiceRenderingTemplates;
var init_InvoiceRenderingTemplates = __esm({
  "../node_modules/stripe/esm/resources/InvoiceRenderingTemplates.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod107 = StripeResource.method;
    InvoiceRenderingTemplates = StripeResource.extend({
      retrieve: stripeMethod107({
        method: "GET",
        fullPath: "/v1/invoice_rendering_templates/{template}"
      }),
      list: stripeMethod107({
        method: "GET",
        fullPath: "/v1/invoice_rendering_templates",
        methodType: "list"
      }),
      archive: stripeMethod107({
        method: "POST",
        fullPath: "/v1/invoice_rendering_templates/{template}/archive"
      }),
      unarchive: stripeMethod107({
        method: "POST",
        fullPath: "/v1/invoice_rendering_templates/{template}/unarchive"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Invoices.js
var stripeMethod108, Invoices;
var init_Invoices = __esm({
  "../node_modules/stripe/esm/resources/Invoices.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod108 = StripeResource.method;
    Invoices = StripeResource.extend({
      create: stripeMethod108({ method: "POST", fullPath: "/v1/invoices" }),
      retrieve: stripeMethod108({ method: "GET", fullPath: "/v1/invoices/{invoice}" }),
      update: stripeMethod108({ method: "POST", fullPath: "/v1/invoices/{invoice}" }),
      list: stripeMethod108({
        method: "GET",
        fullPath: "/v1/invoices",
        methodType: "list"
      }),
      del: stripeMethod108({ method: "DELETE", fullPath: "/v1/invoices/{invoice}" }),
      addLines: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/add_lines"
      }),
      attachPayment: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/attach_payment"
      }),
      createPreview: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/create_preview"
      }),
      finalizeInvoice: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/finalize"
      }),
      listLineItems: stripeMethod108({
        method: "GET",
        fullPath: "/v1/invoices/{invoice}/lines",
        methodType: "list"
      }),
      markUncollectible: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/mark_uncollectible"
      }),
      pay: stripeMethod108({ method: "POST", fullPath: "/v1/invoices/{invoice}/pay" }),
      removeLines: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/remove_lines"
      }),
      search: stripeMethod108({
        method: "GET",
        fullPath: "/v1/invoices/search",
        methodType: "search"
      }),
      sendInvoice: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/send"
      }),
      updateLines: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/update_lines"
      }),
      updateLineItem: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/lines/{line_item_id}"
      }),
      voidInvoice: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/void"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Mandates.js
var stripeMethod109, Mandates;
var init_Mandates = __esm({
  "../node_modules/stripe/esm/resources/Mandates.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod109 = StripeResource.method;
    Mandates = StripeResource.extend({
      retrieve: stripeMethod109({ method: "GET", fullPath: "/v1/mandates/{mandate}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/OAuth.js
var stripeMethod110, oAuthHost, OAuth;
var init_OAuth = __esm({
  "../node_modules/stripe/esm/resources/OAuth.js"() {
    "use strict";
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    init_utils();
    stripeMethod110 = StripeResource.method;
    oAuthHost = "connect.stripe.com";
    OAuth = StripeResource.extend({
      basePath: "/",
      authorizeUrl(params, options) {
        params = params || {};
        options = options || {};
        let path = "oauth/authorize";
        if (options.express) {
          path = `express/${path}`;
        }
        if (!params.response_type) {
          params.response_type = "code";
        }
        if (!params.client_id) {
          params.client_id = this._stripe.getClientId();
        }
        if (!params.scope) {
          params.scope = "read_write";
        }
        return `https://${oAuthHost}/${path}?${queryStringifyRequestData(params)}`;
      },
      token: stripeMethod110({
        method: "POST",
        path: "oauth/token",
        host: oAuthHost
      }),
      deauthorize(spec, ...args) {
        if (!spec.client_id) {
          spec.client_id = this._stripe.getClientId();
        }
        return stripeMethod110({
          method: "POST",
          path: "oauth/deauthorize",
          host: oAuthHost
        }).apply(this, [spec, ...args]);
      }
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentAttemptRecords.js
var stripeMethod111, PaymentAttemptRecords;
var init_PaymentAttemptRecords = __esm({
  "../node_modules/stripe/esm/resources/PaymentAttemptRecords.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod111 = StripeResource.method;
    PaymentAttemptRecords = StripeResource.extend({
      retrieve: stripeMethod111({
        method: "GET",
        fullPath: "/v1/payment_attempt_records/{id}"
      }),
      list: stripeMethod111({
        method: "GET",
        fullPath: "/v1/payment_attempt_records",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentIntents.js
var stripeMethod112, PaymentIntents;
var init_PaymentIntents = __esm({
  "../node_modules/stripe/esm/resources/PaymentIntents.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod112 = StripeResource.method;
    PaymentIntents = StripeResource.extend({
      create: stripeMethod112({ method: "POST", fullPath: "/v1/payment_intents" }),
      retrieve: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents/{intent}"
      }),
      update: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}"
      }),
      list: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents",
        methodType: "list"
      }),
      applyCustomerBalance: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/apply_customer_balance"
      }),
      cancel: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/cancel"
      }),
      capture: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/capture"
      }),
      confirm: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/confirm"
      }),
      incrementAuthorization: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/increment_authorization"
      }),
      listAmountDetailsLineItems: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents/{intent}/amount_details_line_items",
        methodType: "list"
      }),
      search: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents/search",
        methodType: "search"
      }),
      verifyMicrodeposits: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/verify_microdeposits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentLinks.js
var stripeMethod113, PaymentLinks;
var init_PaymentLinks = __esm({
  "../node_modules/stripe/esm/resources/PaymentLinks.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod113 = StripeResource.method;
    PaymentLinks = StripeResource.extend({
      create: stripeMethod113({ method: "POST", fullPath: "/v1/payment_links" }),
      retrieve: stripeMethod113({
        method: "GET",
        fullPath: "/v1/payment_links/{payment_link}"
      }),
      update: stripeMethod113({
        method: "POST",
        fullPath: "/v1/payment_links/{payment_link}"
      }),
      list: stripeMethod113({
        method: "GET",
        fullPath: "/v1/payment_links",
        methodType: "list"
      }),
      listLineItems: stripeMethod113({
        method: "GET",
        fullPath: "/v1/payment_links/{payment_link}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentMethodConfigurations.js
var stripeMethod114, PaymentMethodConfigurations;
var init_PaymentMethodConfigurations = __esm({
  "../node_modules/stripe/esm/resources/PaymentMethodConfigurations.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod114 = StripeResource.method;
    PaymentMethodConfigurations = StripeResource.extend({
      create: stripeMethod114({
        method: "POST",
        fullPath: "/v1/payment_method_configurations"
      }),
      retrieve: stripeMethod114({
        method: "GET",
        fullPath: "/v1/payment_method_configurations/{configuration}"
      }),
      update: stripeMethod114({
        method: "POST",
        fullPath: "/v1/payment_method_configurations/{configuration}"
      }),
      list: stripeMethod114({
        method: "GET",
        fullPath: "/v1/payment_method_configurations",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentMethodDomains.js
var stripeMethod115, PaymentMethodDomains;
var init_PaymentMethodDomains = __esm({
  "../node_modules/stripe/esm/resources/PaymentMethodDomains.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod115 = StripeResource.method;
    PaymentMethodDomains = StripeResource.extend({
      create: stripeMethod115({
        method: "POST",
        fullPath: "/v1/payment_method_domains"
      }),
      retrieve: stripeMethod115({
        method: "GET",
        fullPath: "/v1/payment_method_domains/{payment_method_domain}"
      }),
      update: stripeMethod115({
        method: "POST",
        fullPath: "/v1/payment_method_domains/{payment_method_domain}"
      }),
      list: stripeMethod115({
        method: "GET",
        fullPath: "/v1/payment_method_domains",
        methodType: "list"
      }),
      validate: stripeMethod115({
        method: "POST",
        fullPath: "/v1/payment_method_domains/{payment_method_domain}/validate"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentMethods.js
var stripeMethod116, PaymentMethods;
var init_PaymentMethods = __esm({
  "../node_modules/stripe/esm/resources/PaymentMethods.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod116 = StripeResource.method;
    PaymentMethods = StripeResource.extend({
      create: stripeMethod116({ method: "POST", fullPath: "/v1/payment_methods" }),
      retrieve: stripeMethod116({
        method: "GET",
        fullPath: "/v1/payment_methods/{payment_method}"
      }),
      update: stripeMethod116({
        method: "POST",
        fullPath: "/v1/payment_methods/{payment_method}"
      }),
      list: stripeMethod116({
        method: "GET",
        fullPath: "/v1/payment_methods",
        methodType: "list"
      }),
      attach: stripeMethod116({
        method: "POST",
        fullPath: "/v1/payment_methods/{payment_method}/attach"
      }),
      detach: stripeMethod116({
        method: "POST",
        fullPath: "/v1/payment_methods/{payment_method}/detach"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentRecords.js
var stripeMethod117, PaymentRecords;
var init_PaymentRecords = __esm({
  "../node_modules/stripe/esm/resources/PaymentRecords.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod117 = StripeResource.method;
    PaymentRecords = StripeResource.extend({
      retrieve: stripeMethod117({ method: "GET", fullPath: "/v1/payment_records/{id}" }),
      reportPayment: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/report_payment"
      }),
      reportPaymentAttempt: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt"
      }),
      reportPaymentAttemptCanceled: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_canceled"
      }),
      reportPaymentAttemptFailed: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_failed"
      }),
      reportPaymentAttemptGuaranteed: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_guaranteed"
      }),
      reportPaymentAttemptInformational: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_informational"
      }),
      reportRefund: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_refund"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Payouts.js
var stripeMethod118, Payouts;
var init_Payouts = __esm({
  "../node_modules/stripe/esm/resources/Payouts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod118 = StripeResource.method;
    Payouts = StripeResource.extend({
      create: stripeMethod118({ method: "POST", fullPath: "/v1/payouts" }),
      retrieve: stripeMethod118({ method: "GET", fullPath: "/v1/payouts/{payout}" }),
      update: stripeMethod118({ method: "POST", fullPath: "/v1/payouts/{payout}" }),
      list: stripeMethod118({
        method: "GET",
        fullPath: "/v1/payouts",
        methodType: "list"
      }),
      cancel: stripeMethod118({
        method: "POST",
        fullPath: "/v1/payouts/{payout}/cancel"
      }),
      reverse: stripeMethod118({
        method: "POST",
        fullPath: "/v1/payouts/{payout}/reverse"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Plans.js
var stripeMethod119, Plans;
var init_Plans = __esm({
  "../node_modules/stripe/esm/resources/Plans.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod119 = StripeResource.method;
    Plans = StripeResource.extend({
      create: stripeMethod119({ method: "POST", fullPath: "/v1/plans" }),
      retrieve: stripeMethod119({ method: "GET", fullPath: "/v1/plans/{plan}" }),
      update: stripeMethod119({ method: "POST", fullPath: "/v1/plans/{plan}" }),
      list: stripeMethod119({
        method: "GET",
        fullPath: "/v1/plans",
        methodType: "list"
      }),
      del: stripeMethod119({ method: "DELETE", fullPath: "/v1/plans/{plan}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Prices.js
var stripeMethod120, Prices;
var init_Prices = __esm({
  "../node_modules/stripe/esm/resources/Prices.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod120 = StripeResource.method;
    Prices = StripeResource.extend({
      create: stripeMethod120({ method: "POST", fullPath: "/v1/prices" }),
      retrieve: stripeMethod120({ method: "GET", fullPath: "/v1/prices/{price}" }),
      update: stripeMethod120({ method: "POST", fullPath: "/v1/prices/{price}" }),
      list: stripeMethod120({
        method: "GET",
        fullPath: "/v1/prices",
        methodType: "list"
      }),
      search: stripeMethod120({
        method: "GET",
        fullPath: "/v1/prices/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Products.js
var stripeMethod121, Products2;
var init_Products2 = __esm({
  "../node_modules/stripe/esm/resources/Products.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod121 = StripeResource.method;
    Products2 = StripeResource.extend({
      create: stripeMethod121({ method: "POST", fullPath: "/v1/products" }),
      retrieve: stripeMethod121({ method: "GET", fullPath: "/v1/products/{id}" }),
      update: stripeMethod121({ method: "POST", fullPath: "/v1/products/{id}" }),
      list: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products",
        methodType: "list"
      }),
      del: stripeMethod121({ method: "DELETE", fullPath: "/v1/products/{id}" }),
      createFeature: stripeMethod121({
        method: "POST",
        fullPath: "/v1/products/{product}/features"
      }),
      deleteFeature: stripeMethod121({
        method: "DELETE",
        fullPath: "/v1/products/{product}/features/{id}"
      }),
      listFeatures: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products/{product}/features",
        methodType: "list"
      }),
      retrieveFeature: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products/{product}/features/{id}"
      }),
      search: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PromotionCodes.js
var stripeMethod122, PromotionCodes;
var init_PromotionCodes = __esm({
  "../node_modules/stripe/esm/resources/PromotionCodes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod122 = StripeResource.method;
    PromotionCodes = StripeResource.extend({
      create: stripeMethod122({ method: "POST", fullPath: "/v1/promotion_codes" }),
      retrieve: stripeMethod122({
        method: "GET",
        fullPath: "/v1/promotion_codes/{promotion_code}"
      }),
      update: stripeMethod122({
        method: "POST",
        fullPath: "/v1/promotion_codes/{promotion_code}"
      }),
      list: stripeMethod122({
        method: "GET",
        fullPath: "/v1/promotion_codes",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Quotes.js
var stripeMethod123, Quotes;
var init_Quotes = __esm({
  "../node_modules/stripe/esm/resources/Quotes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod123 = StripeResource.method;
    Quotes = StripeResource.extend({
      create: stripeMethod123({ method: "POST", fullPath: "/v1/quotes" }),
      retrieve: stripeMethod123({ method: "GET", fullPath: "/v1/quotes/{quote}" }),
      update: stripeMethod123({ method: "POST", fullPath: "/v1/quotes/{quote}" }),
      list: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes",
        methodType: "list"
      }),
      accept: stripeMethod123({ method: "POST", fullPath: "/v1/quotes/{quote}/accept" }),
      cancel: stripeMethod123({ method: "POST", fullPath: "/v1/quotes/{quote}/cancel" }),
      finalizeQuote: stripeMethod123({
        method: "POST",
        fullPath: "/v1/quotes/{quote}/finalize"
      }),
      listComputedUpfrontLineItems: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes/{quote}/computed_upfront_line_items",
        methodType: "list"
      }),
      listLineItems: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes/{quote}/line_items",
        methodType: "list"
      }),
      pdf: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes/{quote}/pdf",
        host: "files.stripe.com",
        streaming: true
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Refunds.js
var stripeMethod124, Refunds2;
var init_Refunds2 = __esm({
  "../node_modules/stripe/esm/resources/Refunds.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod124 = StripeResource.method;
    Refunds2 = StripeResource.extend({
      create: stripeMethod124({ method: "POST", fullPath: "/v1/refunds" }),
      retrieve: stripeMethod124({ method: "GET", fullPath: "/v1/refunds/{refund}" }),
      update: stripeMethod124({ method: "POST", fullPath: "/v1/refunds/{refund}" }),
      list: stripeMethod124({
        method: "GET",
        fullPath: "/v1/refunds",
        methodType: "list"
      }),
      cancel: stripeMethod124({
        method: "POST",
        fullPath: "/v1/refunds/{refund}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Reviews.js
var stripeMethod125, Reviews;
var init_Reviews = __esm({
  "../node_modules/stripe/esm/resources/Reviews.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod125 = StripeResource.method;
    Reviews = StripeResource.extend({
      retrieve: stripeMethod125({ method: "GET", fullPath: "/v1/reviews/{review}" }),
      list: stripeMethod125({
        method: "GET",
        fullPath: "/v1/reviews",
        methodType: "list"
      }),
      approve: stripeMethod125({
        method: "POST",
        fullPath: "/v1/reviews/{review}/approve"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SetupAttempts.js
var stripeMethod126, SetupAttempts;
var init_SetupAttempts = __esm({
  "../node_modules/stripe/esm/resources/SetupAttempts.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod126 = StripeResource.method;
    SetupAttempts = StripeResource.extend({
      list: stripeMethod126({
        method: "GET",
        fullPath: "/v1/setup_attempts",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SetupIntents.js
var stripeMethod127, SetupIntents;
var init_SetupIntents = __esm({
  "../node_modules/stripe/esm/resources/SetupIntents.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod127 = StripeResource.method;
    SetupIntents = StripeResource.extend({
      create: stripeMethod127({ method: "POST", fullPath: "/v1/setup_intents" }),
      retrieve: stripeMethod127({
        method: "GET",
        fullPath: "/v1/setup_intents/{intent}"
      }),
      update: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}"
      }),
      list: stripeMethod127({
        method: "GET",
        fullPath: "/v1/setup_intents",
        methodType: "list"
      }),
      cancel: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}/cancel"
      }),
      confirm: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}/confirm"
      }),
      verifyMicrodeposits: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}/verify_microdeposits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ShippingRates.js
var stripeMethod128, ShippingRates;
var init_ShippingRates = __esm({
  "../node_modules/stripe/esm/resources/ShippingRates.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod128 = StripeResource.method;
    ShippingRates = StripeResource.extend({
      create: stripeMethod128({ method: "POST", fullPath: "/v1/shipping_rates" }),
      retrieve: stripeMethod128({
        method: "GET",
        fullPath: "/v1/shipping_rates/{shipping_rate_token}"
      }),
      update: stripeMethod128({
        method: "POST",
        fullPath: "/v1/shipping_rates/{shipping_rate_token}"
      }),
      list: stripeMethod128({
        method: "GET",
        fullPath: "/v1/shipping_rates",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Sources.js
var stripeMethod129, Sources;
var init_Sources = __esm({
  "../node_modules/stripe/esm/resources/Sources.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod129 = StripeResource.method;
    Sources = StripeResource.extend({
      create: stripeMethod129({ method: "POST", fullPath: "/v1/sources" }),
      retrieve: stripeMethod129({ method: "GET", fullPath: "/v1/sources/{source}" }),
      update: stripeMethod129({ method: "POST", fullPath: "/v1/sources/{source}" }),
      listSourceTransactions: stripeMethod129({
        method: "GET",
        fullPath: "/v1/sources/{source}/source_transactions",
        methodType: "list"
      }),
      verify: stripeMethod129({
        method: "POST",
        fullPath: "/v1/sources/{source}/verify"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SubscriptionItems.js
var stripeMethod130, SubscriptionItems;
var init_SubscriptionItems = __esm({
  "../node_modules/stripe/esm/resources/SubscriptionItems.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod130 = StripeResource.method;
    SubscriptionItems = StripeResource.extend({
      create: stripeMethod130({ method: "POST", fullPath: "/v1/subscription_items" }),
      retrieve: stripeMethod130({
        method: "GET",
        fullPath: "/v1/subscription_items/{item}"
      }),
      update: stripeMethod130({
        method: "POST",
        fullPath: "/v1/subscription_items/{item}"
      }),
      list: stripeMethod130({
        method: "GET",
        fullPath: "/v1/subscription_items",
        methodType: "list"
      }),
      del: stripeMethod130({
        method: "DELETE",
        fullPath: "/v1/subscription_items/{item}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SubscriptionSchedules.js
var stripeMethod131, SubscriptionSchedules;
var init_SubscriptionSchedules = __esm({
  "../node_modules/stripe/esm/resources/SubscriptionSchedules.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod131 = StripeResource.method;
    SubscriptionSchedules = StripeResource.extend({
      create: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules"
      }),
      retrieve: stripeMethod131({
        method: "GET",
        fullPath: "/v1/subscription_schedules/{schedule}"
      }),
      update: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules/{schedule}"
      }),
      list: stripeMethod131({
        method: "GET",
        fullPath: "/v1/subscription_schedules",
        methodType: "list"
      }),
      cancel: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules/{schedule}/cancel"
      }),
      release: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules/{schedule}/release"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Subscriptions.js
var stripeMethod132, Subscriptions;
var init_Subscriptions = __esm({
  "../node_modules/stripe/esm/resources/Subscriptions.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod132 = StripeResource.method;
    Subscriptions = StripeResource.extend({
      create: stripeMethod132({ method: "POST", fullPath: "/v1/subscriptions" }),
      retrieve: stripeMethod132({
        method: "GET",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}"
      }),
      update: stripeMethod132({
        method: "POST",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}"
      }),
      list: stripeMethod132({
        method: "GET",
        fullPath: "/v1/subscriptions",
        methodType: "list"
      }),
      cancel: stripeMethod132({
        method: "DELETE",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}"
      }),
      deleteDiscount: stripeMethod132({
        method: "DELETE",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}/discount"
      }),
      migrate: stripeMethod132({
        method: "POST",
        fullPath: "/v1/subscriptions/{subscription}/migrate"
      }),
      resume: stripeMethod132({
        method: "POST",
        fullPath: "/v1/subscriptions/{subscription}/resume"
      }),
      search: stripeMethod132({
        method: "GET",
        fullPath: "/v1/subscriptions/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TaxCodes.js
var stripeMethod133, TaxCodes;
var init_TaxCodes = __esm({
  "../node_modules/stripe/esm/resources/TaxCodes.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod133 = StripeResource.method;
    TaxCodes = StripeResource.extend({
      retrieve: stripeMethod133({ method: "GET", fullPath: "/v1/tax_codes/{id}" }),
      list: stripeMethod133({
        method: "GET",
        fullPath: "/v1/tax_codes",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TaxIds.js
var stripeMethod134, TaxIds;
var init_TaxIds = __esm({
  "../node_modules/stripe/esm/resources/TaxIds.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod134 = StripeResource.method;
    TaxIds = StripeResource.extend({
      create: stripeMethod134({ method: "POST", fullPath: "/v1/tax_ids" }),
      retrieve: stripeMethod134({ method: "GET", fullPath: "/v1/tax_ids/{id}" }),
      list: stripeMethod134({
        method: "GET",
        fullPath: "/v1/tax_ids",
        methodType: "list"
      }),
      del: stripeMethod134({ method: "DELETE", fullPath: "/v1/tax_ids/{id}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/TaxRates.js
var stripeMethod135, TaxRates;
var init_TaxRates = __esm({
  "../node_modules/stripe/esm/resources/TaxRates.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod135 = StripeResource.method;
    TaxRates = StripeResource.extend({
      create: stripeMethod135({ method: "POST", fullPath: "/v1/tax_rates" }),
      retrieve: stripeMethod135({ method: "GET", fullPath: "/v1/tax_rates/{tax_rate}" }),
      update: stripeMethod135({ method: "POST", fullPath: "/v1/tax_rates/{tax_rate}" }),
      list: stripeMethod135({
        method: "GET",
        fullPath: "/v1/tax_rates",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tokens.js
var stripeMethod136, Tokens2;
var init_Tokens2 = __esm({
  "../node_modules/stripe/esm/resources/Tokens.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod136 = StripeResource.method;
    Tokens2 = StripeResource.extend({
      create: stripeMethod136({ method: "POST", fullPath: "/v1/tokens" }),
      retrieve: stripeMethod136({ method: "GET", fullPath: "/v1/tokens/{token}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Topups.js
var stripeMethod137, Topups;
var init_Topups = __esm({
  "../node_modules/stripe/esm/resources/Topups.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod137 = StripeResource.method;
    Topups = StripeResource.extend({
      create: stripeMethod137({ method: "POST", fullPath: "/v1/topups" }),
      retrieve: stripeMethod137({ method: "GET", fullPath: "/v1/topups/{topup}" }),
      update: stripeMethod137({ method: "POST", fullPath: "/v1/topups/{topup}" }),
      list: stripeMethod137({
        method: "GET",
        fullPath: "/v1/topups",
        methodType: "list"
      }),
      cancel: stripeMethod137({ method: "POST", fullPath: "/v1/topups/{topup}/cancel" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Transfers.js
var stripeMethod138, Transfers;
var init_Transfers = __esm({
  "../node_modules/stripe/esm/resources/Transfers.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod138 = StripeResource.method;
    Transfers = StripeResource.extend({
      create: stripeMethod138({ method: "POST", fullPath: "/v1/transfers" }),
      retrieve: stripeMethod138({ method: "GET", fullPath: "/v1/transfers/{transfer}" }),
      update: stripeMethod138({ method: "POST", fullPath: "/v1/transfers/{transfer}" }),
      list: stripeMethod138({
        method: "GET",
        fullPath: "/v1/transfers",
        methodType: "list"
      }),
      createReversal: stripeMethod138({
        method: "POST",
        fullPath: "/v1/transfers/{id}/reversals"
      }),
      listReversals: stripeMethod138({
        method: "GET",
        fullPath: "/v1/transfers/{id}/reversals",
        methodType: "list"
      }),
      retrieveReversal: stripeMethod138({
        method: "GET",
        fullPath: "/v1/transfers/{transfer}/reversals/{id}"
      }),
      updateReversal: stripeMethod138({
        method: "POST",
        fullPath: "/v1/transfers/{transfer}/reversals/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/WebhookEndpoints.js
var stripeMethod139, WebhookEndpoints;
var init_WebhookEndpoints = __esm({
  "../node_modules/stripe/esm/resources/WebhookEndpoints.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_StripeResource();
    stripeMethod139 = StripeResource.method;
    WebhookEndpoints = StripeResource.extend({
      create: stripeMethod139({ method: "POST", fullPath: "/v1/webhook_endpoints" }),
      retrieve: stripeMethod139({
        method: "GET",
        fullPath: "/v1/webhook_endpoints/{webhook_endpoint}"
      }),
      update: stripeMethod139({
        method: "POST",
        fullPath: "/v1/webhook_endpoints/{webhook_endpoint}"
      }),
      list: stripeMethod139({
        method: "GET",
        fullPath: "/v1/webhook_endpoints",
        methodType: "list"
      }),
      del: stripeMethod139({
        method: "DELETE",
        fullPath: "/v1/webhook_endpoints/{webhook_endpoint}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources.js
var resources_exports = {};
__export(resources_exports, {
  Account: () => Accounts3,
  AccountLinks: () => AccountLinks2,
  AccountSessions: () => AccountSessions,
  Accounts: () => Accounts3,
  ApplePayDomains: () => ApplePayDomains,
  ApplicationFees: () => ApplicationFees,
  Apps: () => Apps,
  Balance: () => Balance,
  BalanceSettings: () => BalanceSettings,
  BalanceTransactions: () => BalanceTransactions,
  Billing: () => Billing,
  BillingPortal: () => BillingPortal,
  Charges: () => Charges,
  Checkout: () => Checkout,
  Climate: () => Climate,
  ConfirmationTokens: () => ConfirmationTokens2,
  CountrySpecs: () => CountrySpecs,
  Coupons: () => Coupons,
  CreditNotes: () => CreditNotes,
  CustomerSessions: () => CustomerSessions,
  Customers: () => Customers2,
  Disputes: () => Disputes2,
  Entitlements: () => Entitlements,
  EphemeralKeys: () => EphemeralKeys,
  Events: () => Events2,
  ExchangeRates: () => ExchangeRates,
  FileLinks: () => FileLinks,
  Files: () => Files,
  FinancialConnections: () => FinancialConnections,
  Forwarding: () => Forwarding,
  Identity: () => Identity,
  InvoiceItems: () => InvoiceItems,
  InvoicePayments: () => InvoicePayments,
  InvoiceRenderingTemplates: () => InvoiceRenderingTemplates,
  Invoices: () => Invoices,
  Issuing: () => Issuing,
  Mandates: () => Mandates,
  OAuth: () => OAuth,
  PaymentAttemptRecords: () => PaymentAttemptRecords,
  PaymentIntents: () => PaymentIntents,
  PaymentLinks: () => PaymentLinks,
  PaymentMethodConfigurations: () => PaymentMethodConfigurations,
  PaymentMethodDomains: () => PaymentMethodDomains,
  PaymentMethods: () => PaymentMethods,
  PaymentRecords: () => PaymentRecords,
  Payouts: () => Payouts,
  Plans: () => Plans,
  Prices: () => Prices,
  Products: () => Products2,
  PromotionCodes: () => PromotionCodes,
  Quotes: () => Quotes,
  Radar: () => Radar,
  Refunds: () => Refunds2,
  Reporting: () => Reporting,
  Reviews: () => Reviews,
  SetupAttempts: () => SetupAttempts,
  SetupIntents: () => SetupIntents,
  ShippingRates: () => ShippingRates,
  Sigma: () => Sigma,
  Sources: () => Sources,
  SubscriptionItems: () => SubscriptionItems,
  SubscriptionSchedules: () => SubscriptionSchedules,
  Subscriptions: () => Subscriptions,
  Tax: () => Tax,
  TaxCodes: () => TaxCodes,
  TaxIds: () => TaxIds,
  TaxRates: () => TaxRates,
  Terminal: () => Terminal,
  TestHelpers: () => TestHelpers,
  Tokens: () => Tokens2,
  Topups: () => Topups,
  Transfers: () => Transfers,
  Treasury: () => Treasury,
  V2: () => V2,
  WebhookEndpoints: () => WebhookEndpoints
});
var Apps, Billing, BillingPortal, Checkout, Climate, Entitlements, FinancialConnections, Forwarding, Identity, Issuing, Radar, Reporting, Sigma, Tax, Terminal, TestHelpers, Treasury, V2;
var init_resources = __esm({
  "../node_modules/stripe/esm/resources.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_ResourceNamespace();
    init_AccountLinks();
    init_AccountTokens();
    init_Accounts();
    init_Accounts2();
    init_ActiveEntitlements();
    init_Alerts();
    init_Associations();
    init_Authorizations();
    init_Authorizations2();
    init_Calculations();
    init_Cardholders();
    init_Cards();
    init_Cards2();
    init_Configurations();
    init_Configurations2();
    init_ConfirmationTokens();
    init_ConnectionTokens();
    init_CreditBalanceSummary();
    init_CreditBalanceTransactions();
    init_CreditGrants();
    init_CreditReversals();
    init_Customers();
    init_DebitReversals();
    init_Disputes();
    init_EarlyFraudWarnings();
    init_EventDestinations();
    init_Events();
    init_Features();
    init_FinancialAccounts();
    init_InboundTransfers();
    init_InboundTransfers2();
    init_Locations();
    init_MeterEventAdjustments();
    init_MeterEventAdjustments2();
    init_MeterEventSession();
    init_MeterEventStream();
    init_MeterEvents();
    init_MeterEvents2();
    init_Meters();
    init_OnboardingLinks();
    init_Orders();
    init_OutboundPayments();
    init_OutboundPayments2();
    init_OutboundTransfers();
    init_OutboundTransfers2();
    init_PaymentEvaluations();
    init_PersonalizationDesigns();
    init_PersonalizationDesigns2();
    init_PhysicalBundles();
    init_Products();
    init_Readers();
    init_Readers2();
    init_ReceivedCredits();
    init_ReceivedCredits2();
    init_ReceivedDebits();
    init_ReceivedDebits2();
    init_Refunds();
    init_Registrations();
    init_ReportRuns();
    init_ReportTypes();
    init_Requests();
    init_ScheduledQueryRuns();
    init_Secrets();
    init_Sessions();
    init_Sessions2();
    init_Sessions3();
    init_Settings();
    init_Suppliers();
    init_TestClocks();
    init_Tokens();
    init_TransactionEntries();
    init_Transactions();
    init_Transactions2();
    init_Transactions3();
    init_Transactions4();
    init_Transactions5();
    init_ValueListItems();
    init_ValueLists();
    init_VerificationReports();
    init_VerificationSessions();
    init_Accounts3();
    init_AccountLinks2();
    init_AccountSessions();
    init_Accounts3();
    init_ApplePayDomains();
    init_ApplicationFees();
    init_Balance();
    init_BalanceSettings();
    init_BalanceTransactions();
    init_Charges();
    init_ConfirmationTokens2();
    init_CountrySpecs();
    init_Coupons();
    init_CreditNotes();
    init_CustomerSessions();
    init_Customers2();
    init_Disputes2();
    init_EphemeralKeys();
    init_Events2();
    init_ExchangeRates();
    init_FileLinks();
    init_Files();
    init_InvoiceItems();
    init_InvoicePayments();
    init_InvoiceRenderingTemplates();
    init_Invoices();
    init_Mandates();
    init_OAuth();
    init_PaymentAttemptRecords();
    init_PaymentIntents();
    init_PaymentLinks();
    init_PaymentMethodConfigurations();
    init_PaymentMethodDomains();
    init_PaymentMethods();
    init_PaymentRecords();
    init_Payouts();
    init_Plans();
    init_Prices();
    init_Products2();
    init_PromotionCodes();
    init_Quotes();
    init_Refunds2();
    init_Reviews();
    init_SetupAttempts();
    init_SetupIntents();
    init_ShippingRates();
    init_Sources();
    init_SubscriptionItems();
    init_SubscriptionSchedules();
    init_Subscriptions();
    init_TaxCodes();
    init_TaxIds();
    init_TaxRates();
    init_Tokens2();
    init_Topups();
    init_Transfers();
    init_WebhookEndpoints();
    Apps = resourceNamespace("apps", { Secrets });
    Billing = resourceNamespace("billing", {
      Alerts,
      CreditBalanceSummary,
      CreditBalanceTransactions,
      CreditGrants,
      MeterEventAdjustments,
      MeterEvents,
      Meters
    });
    BillingPortal = resourceNamespace("billingPortal", {
      Configurations,
      Sessions
    });
    Checkout = resourceNamespace("checkout", {
      Sessions: Sessions2
    });
    Climate = resourceNamespace("climate", {
      Orders,
      Products,
      Suppliers
    });
    Entitlements = resourceNamespace("entitlements", {
      ActiveEntitlements,
      Features
    });
    FinancialConnections = resourceNamespace("financialConnections", {
      Accounts,
      Sessions: Sessions3,
      Transactions
    });
    Forwarding = resourceNamespace("forwarding", {
      Requests
    });
    Identity = resourceNamespace("identity", {
      VerificationReports,
      VerificationSessions
    });
    Issuing = resourceNamespace("issuing", {
      Authorizations,
      Cardholders,
      Cards,
      Disputes,
      PersonalizationDesigns,
      PhysicalBundles,
      Tokens,
      Transactions: Transactions2
    });
    Radar = resourceNamespace("radar", {
      EarlyFraudWarnings,
      PaymentEvaluations,
      ValueListItems,
      ValueLists
    });
    Reporting = resourceNamespace("reporting", {
      ReportRuns,
      ReportTypes
    });
    Sigma = resourceNamespace("sigma", {
      ScheduledQueryRuns
    });
    Tax = resourceNamespace("tax", {
      Associations,
      Calculations,
      Registrations,
      Settings,
      Transactions: Transactions3
    });
    Terminal = resourceNamespace("terminal", {
      Configurations: Configurations2,
      ConnectionTokens,
      Locations,
      OnboardingLinks,
      Readers
    });
    TestHelpers = resourceNamespace("testHelpers", {
      ConfirmationTokens,
      Customers,
      Refunds,
      TestClocks,
      Issuing: resourceNamespace("issuing", {
        Authorizations: Authorizations2,
        Cards: Cards2,
        PersonalizationDesigns: PersonalizationDesigns2,
        Transactions: Transactions4
      }),
      Terminal: resourceNamespace("terminal", {
        Readers: Readers2
      }),
      Treasury: resourceNamespace("treasury", {
        InboundTransfers,
        OutboundPayments,
        OutboundTransfers,
        ReceivedCredits,
        ReceivedDebits
      })
    });
    Treasury = resourceNamespace("treasury", {
      CreditReversals,
      DebitReversals,
      FinancialAccounts,
      InboundTransfers: InboundTransfers2,
      OutboundPayments: OutboundPayments2,
      OutboundTransfers: OutboundTransfers2,
      ReceivedCredits: ReceivedCredits2,
      ReceivedDebits: ReceivedDebits2,
      TransactionEntries,
      Transactions: Transactions5
    });
    V2 = resourceNamespace("v2", {
      Billing: resourceNamespace("billing", {
        MeterEventAdjustments: MeterEventAdjustments2,
        MeterEventSession,
        MeterEventStream,
        MeterEvents: MeterEvents2
      }),
      Core: resourceNamespace("core", {
        AccountLinks,
        AccountTokens,
        Accounts: Accounts2,
        EventDestinations,
        Events
      })
    });
  }
});

// ../node_modules/stripe/esm/stripe.core.js
function createStripe(platformFunctions, requestSender = defaultRequestSenderFactory) {
  Stripe2.PACKAGE_VERSION = "20.4.0";
  Stripe2.API_VERSION = ApiVersion;
  Stripe2.USER_AGENT = Object.assign({ bindings_version: Stripe2.PACKAGE_VERSION, lang: "node", publisher: "stripe", uname: null, typescript: false }, determineProcessUserAgentProperties());
  Stripe2.StripeResource = StripeResource;
  Stripe2.StripeContext = StripeContext;
  Stripe2.resources = resources_exports;
  Stripe2.HttpClient = HttpClient;
  Stripe2.HttpClientResponse = HttpClientResponse;
  Stripe2.CryptoProvider = CryptoProvider;
  Stripe2.webhooks = createWebhooks(platformFunctions);
  function Stripe2(key, config = {}) {
    if (!(this instanceof Stripe2)) {
      return new Stripe2(key, config);
    }
    const props = this._getPropsFromConfig(config);
    this._platformFunctions = platformFunctions;
    Object.defineProperty(this, "_emitter", {
      value: this._platformFunctions.createEmitter(),
      enumerable: false,
      configurable: false,
      writable: false
    });
    this.VERSION = Stripe2.PACKAGE_VERSION;
    this.on = this._emitter.on.bind(this._emitter);
    this.once = this._emitter.once.bind(this._emitter);
    this.off = this._emitter.removeListener.bind(this._emitter);
    const agent = props.httpAgent || null;
    this._api = {
      host: props.host || DEFAULT_HOST,
      port: props.port || DEFAULT_PORT,
      protocol: props.protocol || "https",
      basePath: DEFAULT_BASE_PATH,
      version: props.apiVersion || DEFAULT_API_VERSION,
      timeout: validateInteger("timeout", props.timeout, DEFAULT_TIMEOUT),
      maxNetworkRetries: validateInteger("maxNetworkRetries", props.maxNetworkRetries, 2),
      agent,
      httpClient: props.httpClient || (agent ? this._platformFunctions.createNodeHttpClient(agent) : this._platformFunctions.createDefaultHttpClient()),
      dev: false,
      stripeAccount: props.stripeAccount || null,
      stripeContext: props.stripeContext || null
    };
    const typescript = props.typescript || false;
    if (typescript !== Stripe2.USER_AGENT.typescript) {
      Stripe2.USER_AGENT.typescript = typescript;
    }
    if (props.appInfo) {
      this._setAppInfo(props.appInfo);
    }
    this._prepResources();
    this._setAuthenticator(key, props.authenticator);
    this.errors = Error_exports;
    this.webhooks = Stripe2.webhooks;
    this._prevRequestMetrics = [];
    this._enableTelemetry = props.telemetry !== false;
    this._requestSender = requestSender(this);
    this.StripeResource = Stripe2.StripeResource;
  }
  __name(Stripe2, "Stripe");
  Stripe2.errors = Error_exports;
  Stripe2.createNodeHttpClient = platformFunctions.createNodeHttpClient;
  Stripe2.createFetchHttpClient = platformFunctions.createFetchHttpClient;
  Stripe2.createNodeCryptoProvider = platformFunctions.createNodeCryptoProvider;
  Stripe2.createSubtleCryptoProvider = platformFunctions.createSubtleCryptoProvider;
  Stripe2.prototype = {
    // Properties are set in the constructor above
    _appInfo: void 0,
    on: null,
    off: null,
    once: null,
    VERSION: null,
    StripeResource: null,
    webhooks: null,
    errors: null,
    _api: null,
    _prevRequestMetrics: null,
    _emitter: null,
    _enableTelemetry: null,
    _requestSender: null,
    _platformFunctions: null,
    rawRequest(method, path, params, options) {
      return this._requestSender._rawRequest(method, path, params, options);
    },
    /**
     * @private
     */
    _setAuthenticator(key, authenticator) {
      if (key && authenticator) {
        throw new Error("Can't specify both apiKey and authenticator");
      }
      if (!key && !authenticator) {
        throw new Error("Neither apiKey nor config.authenticator provided");
      }
      this._authenticator = key ? createApiKeyAuthenticator(key) : authenticator;
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _setAppInfo(info) {
      if (info && typeof info !== "object") {
        throw new Error("AppInfo must be an object.");
      }
      if (info && !info.name) {
        throw new Error("AppInfo.name is required");
      }
      info = info || {};
      this._appInfo = APP_INFO_PROPERTIES.reduce((accum, prop) => {
        if (typeof info[prop] == "string") {
          accum = accum || {};
          accum[prop] = info[prop];
        }
        return accum;
      }, {});
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _setApiField(key, value) {
      this._api[key] = value;
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     */
    getApiField(key) {
      return this._api[key];
    },
    setClientId(clientId) {
      this._clientId = clientId;
    },
    getClientId() {
      return this._clientId;
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     */
    getConstant: /* @__PURE__ */ __name((c) => {
      switch (c) {
        case "DEFAULT_HOST":
          return DEFAULT_HOST;
        case "DEFAULT_PORT":
          return DEFAULT_PORT;
        case "DEFAULT_BASE_PATH":
          return DEFAULT_BASE_PATH;
        case "DEFAULT_API_VERSION":
          return DEFAULT_API_VERSION;
        case "DEFAULT_TIMEOUT":
          return DEFAULT_TIMEOUT;
        case "MAX_NETWORK_RETRY_DELAY_SEC":
          return MAX_NETWORK_RETRY_DELAY_SEC;
        case "INITIAL_NETWORK_RETRY_DELAY_SEC":
          return INITIAL_NETWORK_RETRY_DELAY_SEC;
      }
      return Stripe2[c];
    }, "getConstant"),
    getMaxNetworkRetries() {
      return this.getApiField("maxNetworkRetries");
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _setApiNumberField(prop, n, defaultVal) {
      const val = validateInteger(prop, n, defaultVal);
      this._setApiField(prop, val);
    },
    getMaxNetworkRetryDelay() {
      return MAX_NETWORK_RETRY_DELAY_SEC;
    },
    getInitialNetworkRetryDelay() {
      return INITIAL_NETWORK_RETRY_DELAY_SEC;
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     *
     * Gets a JSON version of a User-Agent and uses a cached version for a slight
     * speed advantage.
     */
    getClientUserAgent(cb) {
      return this.getClientUserAgentSeeded(Stripe2.USER_AGENT, cb);
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     *
     * Gets a JSON version of a User-Agent by encoding a seeded object and
     * fetching a uname from the system.
     */
    getClientUserAgentSeeded(seed, cb) {
      this._platformFunctions.getUname().then((uname) => {
        var _a;
        const userAgent = {};
        for (const field in seed) {
          if (!Object.prototype.hasOwnProperty.call(seed, field)) {
            continue;
          }
          userAgent[field] = encodeURIComponent((_a = seed[field]) !== null && _a !== void 0 ? _a : "null");
        }
        userAgent.uname = encodeURIComponent(uname || "UNKNOWN");
        const client = this.getApiField("httpClient");
        if (client) {
          userAgent.httplib = encodeURIComponent(client.getClientName());
        }
        if (this._appInfo) {
          userAgent.application = this._appInfo;
        }
        cb(JSON.stringify(userAgent));
      });
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     */
    getAppInfoAsString() {
      if (!this._appInfo) {
        return "";
      }
      let formatted = this._appInfo.name;
      if (this._appInfo.version) {
        formatted += `/${this._appInfo.version}`;
      }
      if (this._appInfo.url) {
        formatted += ` (${this._appInfo.url})`;
      }
      return formatted;
    },
    getTelemetryEnabled() {
      return this._enableTelemetry;
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _prepResources() {
      for (const name in resources_exports) {
        if (!Object.prototype.hasOwnProperty.call(resources_exports, name)) {
          continue;
        }
        this[pascalToCamelCase(name)] = new resources_exports[name](this);
      }
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _getPropsFromConfig(config) {
      if (!config) {
        return {};
      }
      const isString = typeof config === "string";
      const isObject2 = config === Object(config) && !Array.isArray(config);
      if (!isObject2 && !isString) {
        throw new Error("Config must either be an object or a string");
      }
      if (isString) {
        return {
          apiVersion: config
        };
      }
      const values = Object.keys(config).filter((value) => !ALLOWED_CONFIG_PROPERTIES.includes(value));
      if (values.length > 0) {
        throw new Error(`Config object may only contain the following: ${ALLOWED_CONFIG_PROPERTIES.join(", ")}`);
      }
      return config;
    },
    parseEventNotification(payload, header, secret, tolerance, cryptoProvider, receivedAt) {
      const eventNotification = this.webhooks.constructEvent(payload, header, secret, tolerance, cryptoProvider, receivedAt);
      if (eventNotification.context) {
        eventNotification.context = StripeContext.parse(eventNotification.context);
      }
      eventNotification.fetchEvent = () => {
        return this._requestSender._rawRequest("GET", `/v2/core/events/${eventNotification.id}`, void 0, {
          stripeContext: eventNotification.context
        }, ["fetch_event"]);
      };
      eventNotification.fetchRelatedObject = () => {
        if (!eventNotification.related_object) {
          return Promise.resolve(null);
        }
        return this._requestSender._rawRequest("GET", eventNotification.related_object.url, void 0, {
          stripeContext: eventNotification.context
        }, ["fetch_related_object"]);
      };
      return eventNotification;
    }
  };
  return Stripe2;
}
var DEFAULT_HOST, DEFAULT_PORT, DEFAULT_BASE_PATH, DEFAULT_API_VERSION, DEFAULT_TIMEOUT, MAX_NETWORK_RETRY_DELAY_SEC, INITIAL_NETWORK_RETRY_DELAY_SEC, APP_INFO_PROPERTIES, ALLOWED_CONFIG_PROPERTIES, defaultRequestSenderFactory;
var init_stripe_core = __esm({
  "../node_modules/stripe/esm/stripe.core.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_Error();
    init_RequestSender();
    init_StripeResource();
    init_StripeContext();
    init_Webhooks();
    init_apiVersion();
    init_CryptoProvider();
    init_HttpClient();
    init_resources();
    init_utils();
    DEFAULT_HOST = "api.stripe.com";
    DEFAULT_PORT = "443";
    DEFAULT_BASE_PATH = "/v1/";
    DEFAULT_API_VERSION = ApiVersion;
    DEFAULT_TIMEOUT = 8e4;
    MAX_NETWORK_RETRY_DELAY_SEC = 5;
    INITIAL_NETWORK_RETRY_DELAY_SEC = 0.5;
    APP_INFO_PROPERTIES = ["name", "version", "url", "partner_id"];
    ALLOWED_CONFIG_PROPERTIES = [
      "authenticator",
      "apiVersion",
      "typescript",
      "maxNetworkRetries",
      "httpAgent",
      "httpClient",
      "timeout",
      "host",
      "port",
      "protocol",
      "telemetry",
      "appInfo",
      "stripeAccount",
      "stripeContext"
    ];
    defaultRequestSenderFactory = /* @__PURE__ */ __name((stripe) => new RequestSender(stripe, StripeResource.MAX_BUFFERED_REQUEST_METRICS), "defaultRequestSenderFactory");
    __name(createStripe, "createStripe");
  }
});

// ../node_modules/stripe/esm/stripe.esm.worker.js
var stripe_esm_worker_exports = {};
__export(stripe_esm_worker_exports, {
  Stripe: () => Stripe,
  default: () => stripe_esm_worker_default
});
var Stripe, stripe_esm_worker_default;
var init_stripe_esm_worker = __esm({
  "../node_modules/stripe/esm/stripe.esm.worker.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_WebPlatformFunctions();
    init_stripe_core();
    Stripe = createStripe(new WebPlatformFunctions());
    stripe_esm_worker_default = Stripe;
  }
});

// api/checkout-session-status.js
function json11(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS6
    }
  });
}
async function onRequestOptions6() {
  return new Response(null, { status: 204, headers: CORS_HEADERS6 });
}
async function onRequestGet4({ request, env }) {
  try {
    const secretKey = String(env?.STRIPE_SECRET_KEY || "").trim();
    if (!secretKey) {
      return json11({ error: "Missing STRIPE_SECRET_KEY on the server." }, 500);
    }
    const url = new URL(request.url);
    const sessionId = String(url.searchParams.get("session_id") || "").trim();
    if (!sessionId) {
      return json11({ error: "Missing session_id." }, 400);
    }
    const stripe = new stripe_esm_worker_default(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return json11({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email || null,
      amountTotal: session.amount_total,
      currency: session.currency
    });
  } catch (err) {
    console.error("CHECKOUT SESSION STATUS ERROR:", err);
    return json11({ error: String(err?.message || "Server error retrieving checkout session.") }, 500);
  }
}
var CORS_HEADERS6;
var init_checkout_session_status = __esm({
  "api/checkout-session-status.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_stripe_esm_worker();
    CORS_HEADERS6 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json11, "json");
    __name(onRequestOptions6, "onRequestOptions");
    __name(onRequestGet4, "onRequestGet");
  }
});

// api/collections/index.js
function json12(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS7, ...extraHeaders }
  });
}
function slugify2(input) {
  return String(input || "").trim().toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
async function requireAdmin9(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
async function onRequestOptions7() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS7 } });
}
async function onRequestGet5({ env }) {
  try {
    const res = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, images_json, created_at, updated_at FROM collections WHERE is_active=1 ORDER BY COALESCE(sort_order, 999999), created_at ASC"
    ).all();
    return json12({ ok: true, collections: res?.results || [] });
  } catch (err) {
    console.error("COLLECTIONS LIST ERROR:", err);
    return json12({ ok: false, error: "Server error." }, 500);
  }
}
async function onRequestPost6({ request, env }) {
  const auth = await requireAdmin9(request, env);
  if (!auth.ok) return json12({ ok: false, error: auth.error }, auth.status);
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json12({ ok: false, error: "Invalid JSON body." }, 400);
  }
  const name = String(payload.name || "").trim();
  if (!name) return json12({ ok: false, error: "Name is required." }, 400);
  const id = String(payload.id || payload.slug || "").trim() || slugify2(name);
  const badge = String(payload.badge || "").trim();
  const tagline = String(payload.tagline || "").trim();
  const description = String(payload.description || "").trim();
  const sortOrder = payload.sort_order === "" || payload.sort_order === null || typeof payload.sort_order === "undefined" ? 0 : Number(payload.sort_order);
  const isActive = payload.is_active === false || payload.is_active === 0 ? 0 : 1;
  const specsJson = "[]";
  const documentsJson = "[]";
  const reviewsJson = "[]";
  const shippingMd = "";
  const isolatesJson = "[]";
  const terpenesJson = "[]";
  let imagesJson = "[]";
  if (Array.isArray(payload.images)) {
    const cleaned = payload.images.filter((x) => x && typeof x.url === "string" && x.url.trim()).map((x) => ({
      url: String(x.url).trim(),
      alt: String(x.alt || "").trim(),
      isPrimary: Boolean(x.isPrimary)
    }));
    imagesJson = JSON.stringify(cleaned);
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const updatedAt = createdAt;
  try {
    await env.DB.prepare(
      "INSERT INTO collections (id, name, badge, tagline, description, sort_order, is_active, specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
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
    ).run();
    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, created_at, updated_at FROM collections WHERE id=?"
    ).bind(id).first();
    return json12({ ok: true, collection: row }, 201);
  } catch (err) {
    console.error("COLLECTION CREATE ERROR:", err);
    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("unique") || msg.includes("constraint")) {
      return json12({ ok: false, error: "A collection with that Id/Slug already exists." }, 409);
    }
    if (msg.includes("no such column") && msg.includes("images_json")) {
      return json12(
        { ok: false, error: "DB is missing images_json. Run migration 0005_collections_images_column.sql." },
        500
      );
    }
    return json12({ ok: false, error: "Server error." }, 500);
  }
}
var CORS_HEADERS7;
var init_collections = __esm({
  "api/collections/index.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS7 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json12, "json");
    __name(slugify2, "slugify");
    __name(requireAdmin9, "requireAdmin");
    __name(onRequestOptions7, "onRequestOptions");
    __name(onRequestGet5, "onRequestGet");
    __name(onRequestPost6, "onRequestPost");
  }
});

// api/contact.js
function json13(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS8
    }
  });
}
async function onRequestOptions8() {
  return new Response(null, { status: 204, headers: CORS_HEADERS8 });
}
async function onRequestPost7({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    if (!firstName || !lastName || !email || !message) {
      return json13({ ok: false, error: "Please complete all fields." }, 400);
    }
    if (!email.includes("@")) {
      return json13({ ok: false, error: "Please provide a valid email." }, 400);
    }
    const resendApiKey = String(env?.RESEND_API_KEY || "").trim();
    const toEmail = String(env?.CONTACT_TO_EMAIL || "info@elementlab.shop").trim();
    const fromEmail = String(env?.CONTACT_FROM_EMAIL || "onboarding@resend.dev").trim();
    if (!resendApiKey) {
      return json13({ ok: false, error: "Server is not configured for email yet (missing RESEND_API_KEY)." }, 500);
    }
    const subject = `Contact Request - ${firstName} ${lastName}`;
    const text = [
      `First Name: ${firstName}`,
      `Last Name: ${lastName}`,
      `Email: ${email}`,
      "",
      "Message:",
      message
    ].join("\n");
    const html = `
      <h2>New Contact Request</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; font-family: inherit;">${message}</pre>
    `;
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject,
        text,
        html
      })
    });
    const resendData = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("CONTACT EMAIL ERROR:", resendData);
      return json13({ ok: false, error: "Failed to send email." }, 502);
    }
    return json13({ ok: true, id: resendData?.id || null });
  } catch (err) {
    console.error("CONTACT ROUTE ERROR:", err);
    return json13({ ok: false, error: "Server error." }, 500);
  }
}
var CORS_HEADERS8;
var init_contact = __esm({
  "api/contact.js"() {
    init_functionsRoutes_0_7157080303585999();
    CORS_HEADERS8 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json13, "json");
    __name(onRequestOptions8, "onRequestOptions");
    __name(onRequestPost7, "onRequestPost");
  }
});

// api/create-checkout-session.js
function json14(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS9
    }
  });
}
function parseUnitPrice(item) {
  const sizeText = String(item?.size || "");
  const sampleKitLike = /sample\s*kit/i.test(sizeText) || /sample\s*kit/i.test(String(item?.profileName || ""));
  if (sampleKitLike) return 199;
  const match2 = sizeText.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  if (match2) {
    const parsed = Number(match2[1]);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  const explicitPrice = Number(item?.unitPrice);
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return explicitPrice;
  return 0;
}
function sanitizeItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
    const unitPrice = parseUnitPrice(item);
    return {
      productId: String(item?.productId || ""),
      collectionName: String(item?.collectionName || "Element Lab"),
      profileName: String(item?.profileName || "Custom Product"),
      profileSlug: String(item?.profileSlug || ""),
      size: String(item?.size || ""),
      quantity,
      unitPrice
    };
  }).filter((item) => item.quantity > 0 && item.unitPrice > 0);
}
async function onRequestOptions9() {
  return new Response(null, { status: 204, headers: CORS_HEADERS9 });
}
async function onRequestPost8({ request, env }) {
  try {
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = parseCookie(cookieHeader);
    const token = cookies?.el_session || "";
    const user = await getUserFromSession(env, token);
    const secretKey = String(env?.STRIPE_SECRET_KEY || "").trim();
    if (!secretKey) {
      return json14({ error: "Missing STRIPE_SECRET_KEY on the server." }, 500);
    }
    const body = await request.json().catch(() => ({}));
    const items = sanitizeItems(body?.items);
    if (!items.length) {
      return json14({ error: "Your cart is empty or contains invalid pricing." }, 400);
    }
    const origin = new URL(request.url).origin;
    const stripe = new stripe_esm_worker_default(secretKey);
    const lineItems = items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: {
          name: item.profileName,
          description: [item.collectionName, item.size].filter(Boolean).join(" \u2022 "),
          metadata: {
            productId: item.productId,
            profileSlug: item.profileSlug
          }
        }
      }
    }));
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/cart?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?checkout=cancel`,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "NZ", "IE", "DE", "FR", "NL", "IT", "ES", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "PT", "LU"]
      },
      phone_number_collection: { enabled: true },
      metadata: {
        cart_source: "cart-page",
        user_id: user?.id ? String(user.id) : "",
        items: JSON.stringify(items)
      }
    });
    return json14({ sessionId: session.id, url: session.url || null });
  } catch (err) {
    console.error("CREATE CHECKOUT SESSION ERROR:", err);
    return json14({ error: String(err?.message || "Server error creating checkout session.") }, 500);
  }
}
var CORS_HEADERS9;
var init_create_checkout_session = __esm({
  "api/create-checkout-session.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_stripe_esm_worker();
    init_auth();
    CORS_HEADERS9 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json14, "json");
    __name(parseUnitPrice, "parseUnitPrice");
    __name(sanitizeItems, "sanitizeItems");
    __name(onRequestOptions9, "onRequestOptions");
    __name(onRequestPost8, "onRequestPost");
  }
});

// api/purchase.js
function json15(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS10
    }
  });
}
async function onRequestOptions10() {
  return new Response(null, { status: 204, headers: CORS_HEADERS10 });
}
async function onRequestPost9() {
  return json15({
    ok: true,
    message: "Stripe checkout now uses Checkout Sessions directly. This endpoint is no longer required for the cart flow."
  });
}
var CORS_HEADERS10;
var init_purchase = __esm({
  "api/purchase.js"() {
    init_functionsRoutes_0_7157080303585999();
    CORS_HEADERS10 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json15, "json");
    __name(onRequestOptions10, "onRequestOptions");
    __name(onRequestPost9, "onRequestPost");
  }
});

// api/stripe-webhook.js
function json16(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
async function onRequestPost10({ request, env }) {
  const rawBody = await request.arrayBuffer();
  const sig = request.headers.get("stripe-signature");
  if (!STRIPE_SECRET_KEY) return json16({ ok: false, error: "Stripe secret key not set." }, 500);
  let event;
  try {
    const { default: Stripe2 } = await Promise.resolve().then(() => (init_stripe_esm_worker(), stripe_esm_worker_exports));
    const stripe = new Stripe2(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return json16({ ok: false, error: `Webhook signature verification failed: ${err.message}` }, 400);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const user_id = session.metadata?.user_id || null;
    const items = session.metadata?.items || "[]";
    const total_amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : null;
    const stripe_payment_id = session.payment_intent || session.id;
    const shipping_address = session.shipping ? JSON.stringify(session.shipping) : null;
    if (!user_id || !total_amount) {
      return json16({ ok: false, error: "Missing user_id or amount in session metadata." }, 400);
    }
    try {
      await env.DB.prepare(
        `INSERT INTO purchases (user_id, items, total_amount, purchased_at, stripe_payment_id, shipping_address) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`
      ).bind(user_id, items, total_amount, stripe_payment_id, shipping_address).run();
      return json16({ ok: true });
    } catch (err) {
      return json16({ ok: false, error: `DB error: ${err.message}` }, 500);
    }
  }
  return json16({ ok: true, ignored: true });
}
async function onRequestOptions11() {
  return new Response(null, { status: 204 });
}
var STRIPE_SECRET_KEY;
var init_stripe_webhook = __esm({
  "api/stripe-webhook.js"() {
    init_functionsRoutes_0_7157080303585999();
    STRIPE_SECRET_KEY = typeof STRIPE_SECRET_KEY !== "undefined" ? STRIPE_SECRET_KEY : void 0;
    __name(json16, "json");
    __name(onRequestPost10, "onRequestPost");
    __name(onRequestOptions11, "onRequestOptions");
  }
});

// api/user-purchases.js
function json17(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS11, ...extraHeaders }
  });
}
async function onRequestOptions12() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS11 } });
}
async function onRequestGet6({ request, env }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return json17({ ok: false, error: "Unauthorized" }, 401);
  try {
    const res = await env.DB.prepare(
      "SELECT id, items, total_amount, purchased_at, stripe_payment_id FROM purchases WHERE user_id = ? ORDER BY purchased_at DESC"
    ).bind(user.id).all();
    return json17({ ok: true, purchases: res?.results || [] });
  } catch (err) {
    console.error("USER PURCHASES ERROR:", err);
    return json17({ ok: false, error: "Server error." }, 500);
  }
}
var CORS_HEADERS11;
var init_user_purchases = __esm({
  "api/user-purchases.js"() {
    init_functionsRoutes_0_7157080303585999();
    init_auth();
    CORS_HEADERS11 = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    __name(json17, "json");
    __name(onRequestOptions12, "onRequestOptions");
    __name(onRequestGet6, "onRequestGet");
  }
});

// api/blog.js
async function onRequest5(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  if (url.pathname === "/api/blog" && method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM blog_posts ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" }
    });
  }
  if (url.pathname === "/api/blog" && method === "POST") {
    const data = await request.json();
    const { title, message, image_url, attachment_url } = data;
    if (!title || !message) {
      return new Response(JSON.stringify({ error: "Title and message required" }), { status: 400 });
    }
    const stmt = env.DB.prepare(
      "INSERT INTO blog_posts (title, message, image_url, attachment_url) VALUES (?, ?, ?, ?)"
    );
    await stmt.bind(title, message, image_url || null, attachment_url || null).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  }
  const blogIdMatch = url.pathname.match(/^\/api\/blog\/(\d+)$/);
  if (blogIdMatch && method === "GET") {
    const id = blogIdMatch[1];
    const result = await env.DB.prepare("SELECT * FROM blog_posts WHERE id = ?").bind(id).first();
    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  }
  if (blogIdMatch && method === "DELETE") {
    const id = blogIdMatch[1];
    await env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return new Response("Not found", { status: 404 });
}
var init_blog = __esm({
  "api/blog.js"() {
    init_functionsRoutes_0_7157080303585999();
    __name(onRequest5, "onRequest");
  }
});

// ../.wrangler/tmp/pages-c9fyiD/functionsRoutes-0.7157080303585999.mjs
var routes;
var init_functionsRoutes_0_7157080303585999 = __esm({
  "../.wrangler/tmp/pages-c9fyiD/functionsRoutes-0.7157080303585999.mjs"() {
    init_download();
    init_download();
    init_upload();
    init_upload();
    init_docId();
    init_docId();
    init_profileId();
    init_profiles();
    init_sample_profiles();
    init_login();
    init_logout();
    init_me();
    init_register();
    init_direct_upload();
    init_direct_upload();
    init_id();
    init_id();
    init_id();
    init_slug();
    init_checkout_session_status();
    init_checkout_session_status();
    init_collections();
    init_collections();
    init_collections();
    init_contact();
    init_contact();
    init_create_checkout_session();
    init_create_checkout_session();
    init_purchase();
    init_purchase();
    init_stripe_webhook();
    init_stripe_webhook();
    init_user_purchases();
    init_user_purchases();
    init_blog();
    routes = [
      {
        routePath: "/api/collections/:id/documents/:docId/download",
        mountPath: "/api/collections/:id/documents/:docId",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/collections/:id/documents/:docId/download",
        mountPath: "/api/collections/:id/documents/:docId",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions]
      },
      {
        routePath: "/api/collections/:id/documents/upload",
        mountPath: "/api/collections/:id/documents",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions2]
      },
      {
        routePath: "/api/collections/:id/documents/upload",
        mountPath: "/api/collections/:id/documents",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/collections/:id/documents/:docId",
        mountPath: "/api/collections/:id/documents",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete]
      },
      {
        routePath: "/api/collections/:id/documents/:docId",
        mountPath: "/api/collections/:id/documents",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions3]
      },
      {
        routePath: "/api/collections/:id/sample-profiles/:profileId",
        mountPath: "/api/collections/:id/sample-profiles",
        method: "",
        middlewares: [],
        modules: [onRequest]
      },
      {
        routePath: "/api/collections/:id/profiles",
        mountPath: "/api/collections/:id",
        method: "",
        middlewares: [],
        modules: [onRequest2]
      },
      {
        routePath: "/api/collections/:id/sample-profiles",
        mountPath: "/api/collections/:id",
        method: "",
        middlewares: [],
        modules: [onRequest3]
      },
      {
        routePath: "/api/auth/login",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/auth/logout",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/auth/me",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/auth/register",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/images/direct-upload",
        mountPath: "/api/images",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions4]
      },
      {
        routePath: "/api/images/direct-upload",
        mountPath: "/api/images",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/collections/:id",
        mountPath: "/api/collections",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet3]
      },
      {
        routePath: "/api/collections/:id",
        mountPath: "/api/collections",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions5]
      },
      {
        routePath: "/api/collections/:id",
        mountPath: "/api/collections",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut]
      },
      {
        routePath: "/api/profiles/:slug",
        mountPath: "/api/profiles",
        method: "",
        middlewares: [],
        modules: [onRequest4]
      },
      {
        routePath: "/api/checkout-session-status",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet4]
      },
      {
        routePath: "/api/checkout-session-status",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions6]
      },
      {
        routePath: "/api/collections",
        mountPath: "/api/collections",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet5]
      },
      {
        routePath: "/api/collections",
        mountPath: "/api/collections",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions7]
      },
      {
        routePath: "/api/collections",
        mountPath: "/api/collections",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/contact",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions8]
      },
      {
        routePath: "/api/contact",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/api/create-checkout-session",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions9]
      },
      {
        routePath: "/api/create-checkout-session",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost8]
      },
      {
        routePath: "/api/purchase",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions10]
      },
      {
        routePath: "/api/purchase",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost9]
      },
      {
        routePath: "/api/stripe-webhook",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions11]
      },
      {
        routePath: "/api/stripe-webhook",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost10]
      },
      {
        routePath: "/api/user-purchases",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet6]
      },
      {
        routePath: "/api/user-purchases",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions12]
      },
      {
        routePath: "/api/blog",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest5]
      }
    ];
  }
});

// ../.wrangler/tmp/bundle-JCsuOJ/middleware-loader.entry.ts
init_functionsRoutes_0_7157080303585999();

// ../.wrangler/tmp/bundle-JCsuOJ/middleware-insertion-facade.js
init_functionsRoutes_0_7157080303585999();

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_7157080303585999();

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_7157080303585999();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_7157080303585999();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_7157080303585999();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-JCsuOJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_7157080303585999();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-JCsuOJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.27725082977811.mjs.map
