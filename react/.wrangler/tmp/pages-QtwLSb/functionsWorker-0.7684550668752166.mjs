var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _lib/auth.js
var encoder = new TextEncoder();
function json(status, data, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  return new Response(JSON.stringify(data), { status, headers });
}
__name(json, "json");
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
__name(normalizeEmail, "normalizeEmail");
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
__name(cookieOptions, "cookieOptions");
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
__name(setCookie, "setCookie");
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
__name(parseCookie, "parseCookie");
function randomToken(byteLen = 32) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomToken, "randomToken");
var DEFAULT_PBKDF2_ITERS = 1e5;
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
__name(hashPassword, "hashPassword");
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
__name(verifyPassword, "verifyPassword");
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
__name(getUserFromSession, "getUserFromSession");
function toHex(u8) {
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function fromHex(hex) {
  const clean = String(hex || "").trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
__name(fromHex, "fromHex");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");

// api/collections/[id]/documents/[docId]/download.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function withCors(headers = {}) {
  return { ...headers, ...CORS_HEADERS };
}
__name(withCors, "withCors");
function json2(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCors({ "Content-Type": "application/json", ...extraHeaders })
  });
}
__name(json2, "json");
function safeJsonArray(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
__name(safeJsonArray, "safeJsonArray");
async function requireLoginIfConfigured(request, env) {
  if (String(env.DOCS_REQUIRE_LOGIN || "") !== "1") return { ok: true };
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  return { ok: true, user };
}
__name(requireLoginIfConfigured, "requireLoginIfConfigured");
async function onRequestOptions() {
  return new Response(null, { status: 204, headers: withCors() });
}
__name(onRequestOptions, "onRequestOptions");
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
__name(onRequestGet, "onRequestGet");

// api/collections/[id]/documents/upload.js
var CORS_HEADERS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json3(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS2, ...extraHeaders }
  });
}
__name(json3, "json");
async function requireAdmin(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin, "requireAdmin");
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
__name(safeJsonArray2, "safeJsonArray");
function sanitizeFileName(name) {
  const base = String(name || "document").replace(/[/\\?%*:|"<>]/g, "_");
  return base.length > 120 ? base.slice(0, 120) : base;
}
__name(sanitizeFileName, "sanitizeFileName");
async function onRequestOptions2() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS2 } });
}
__name(onRequestOptions2, "onRequestOptions");
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
__name(onRequestPost, "onRequestPost");

// api/collections/[id]/documents/[docId].js
var CORS_HEADERS3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json4(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS3, ...extraHeaders }
  });
}
__name(json4, "json");
async function requireAdmin2(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin2, "requireAdmin");
function safeJsonArray3(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
__name(safeJsonArray3, "safeJsonArray");
async function onRequestOptions3() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS3 } });
}
__name(onRequestOptions3, "onRequestOptions");
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
__name(onRequestDelete, "onRequestDelete");

// api/collections/[id]/profiles.js
function json5(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
__name(json5, "json");
function slugify(input) {
  return String(input || "").trim().toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
__name(slugify, "slugify");
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
function cleanImagesArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x.url === "string" && x.url.trim()).map((x, idx) => ({
    url: String(x.url).trim(),
    alt: String(x.alt || "").trim(),
    kind: String(x.kind || "gallery").trim() || "gallery",
    sort_order: x.sort_order === void 0 || x.sort_order === null || x.sort_order === "" ? idx : Number(x.sort_order)
  }));
}
__name(cleanImagesArray, "cleanImagesArray");
async function requireAdmin3(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin3, "requireAdmin");
async function onRequest(context) {
  const { request, env, params } = context;
  const id = params?.id;
  if (!id) return json5({ ok: false, error: "Missing collection id" }, 400);
  if (request.method === "GET") {
    try {
      const res = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE collection_id=? AND is_active=1 ORDER BY COALESCE(sort_order, 999999), created_at ASC"
      ).bind(id).all();
      return json5({ ok: true, profiles: res?.results || [] });
    } catch (err) {
      console.error("PROFILES GET ERROR:", err);
      return json5({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "POST") {
    const gate = await requireAdmin3(request, env);
    if (!gate.ok) return json5({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json5({ ok: false, error: "Invalid JSON" }, 400);
    }
    const name = String(body?.name || "").trim();
    if (!name) return json5({ ok: false, error: "Name is required" }, 400);
    const slug = slugify(body?.slug || name);
    if (!slug) return json5({ ok: false, error: "Slug is required" }, 400);
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
      if (!col) return json5({ ok: false, error: "Collection not found" }, 404);
      const existing = await env.DB.prepare("SELECT id FROM flavor_profiles WHERE slug=?").bind(slug).first();
      if (existing) return json5({ ok: false, error: "Slug already exists" }, 409);
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
      return json5({ ok: true, profile: created }, 201);
    } catch (err) {
      console.error("PROFILES POST ERROR:", err);
      return json5({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json5({ ok: false, error: "Method not allowed" }, 405);
}
__name(onRequest, "onRequest");

// api/auth/login.js
var SESSION_COOKIE = "el_session";
var SESSION_TTL_MS = 1e3 * 60 * 60 * 24 * 14;
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
__name(onRequestPost2, "onRequestPost");

// api/auth/logout.js
var SESSION_COOKIE2 = "el_session";
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
__name(onRequestPost3, "onRequestPost");

// api/auth/me.js
var SESSION_COOKIE3 = "el_session";
async function onRequestGet2(context) {
  const cookies = parseCookie(context.request.headers.get("Cookie"));
  const token = cookies[SESSION_COOKIE3];
  const user = await getUserFromSession(context.env, token);
  return json(200, { ok: true, user: user || null });
}
__name(onRequestGet2, "onRequestGet");

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
__name(onRequestPost4, "onRequestPost");

// api/images/direct-upload.js
var CORS_HEADERS4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json6(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS4, ...extraHeaders }
  });
}
__name(json6, "json");
async function requireAdmin4(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin4, "requireAdmin");
async function onRequestOptions4() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS4 } });
}
__name(onRequestOptions4, "onRequestOptions");
async function onRequestPost5({ request, env }) {
  const gate = await requireAdmin4(request, env);
  if (!gate.ok) return json6({ ok: false, error: gate.error }, gate.status);
  const accountId = env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) {
    return json6(
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
    return json6({ ok: false, error: msg }, 502);
  }
  return json6({ ok: true, id: data.result?.id, uploadURL: data.result?.uploadURL });
}
__name(onRequestPost5, "onRequestPost");

// api/collections/[id].js
var CORS_HEADERS5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json7(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS5, ...extraHeaders }
  });
}
__name(json7, "json");
async function requireAdmin5(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin5, "requireAdmin");
function toText(v) {
  if (v === null || typeof v === "undefined") return null;
  return String(v);
}
__name(toText, "toText");
function toNumber(v) {
  if (v === null || typeof v === "undefined" || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
__name(toNumber, "toNumber");
function toBool01(v) {
  if (v === null || typeof v === "undefined") return null;
  return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
}
__name(toBool01, "toBool01");
function toJsonText(v) {
  if (v === null || typeof v === "undefined") return null;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}
__name(toJsonText, "toJsonText");
async function onRequestOptions5() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS5 } });
}
__name(onRequestOptions5, "onRequestOptions");
async function onRequestGet3({ env, params }) {
  const id = params?.id;
  if (!id) return json7({ ok: false, error: "Missing collection id." }, 400);
  try {
    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, created_at, updated_at FROM collections WHERE id=?"
    ).bind(id).first();
    if (!row) return json7({ ok: false, error: "Collection not found." }, 404);
    return json7({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION GET ERROR:", err);
    return json7({ ok: false, error: "Server error." }, 500);
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPut({ request, env, params }) {
  const id = params?.id;
  if (!id) return json7({ ok: false, error: "Missing collection id." }, 400);
  const auth = await requireAdmin5(request, env);
  if (!auth.ok) return json7({ ok: false, error: auth.error }, auth.status);
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json7({ ok: false, error: "Invalid JSON body." }, 400);
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
  if (sets.length === 0) return json7({ ok: false, error: "No fields to update." }, 400);
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  sets.push("updated_at=?");
  binds.push(updatedAt);
  binds.push(id);
  try {
    await env.DB.prepare(`UPDATE collections SET ${sets.join(", ")} WHERE id=?`).bind(...binds).run();
    const row = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, specs_json, documents_json, reviews_json, shipping_md, isolates_json, terpenes_json, images_json, created_at, updated_at FROM collections WHERE id=?"
    ).bind(id).first();
    return json7({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION UPDATE ERROR:", err);
    return json7({ ok: false, error: "Server error." }, 500);
  }
}
__name(onRequestPut, "onRequestPut");

// api/profiles/[slug].js
function json8(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
__name(json8, "json");
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso2, "nowIso");
async function requireAdmin6(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin6, "requireAdmin");
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
__name(asJsonTextArray, "asJsonTextArray");
function parseJsonArray(text) {
  try {
    const v = JSON.parse(text || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
__name(parseJsonArray, "parseJsonArray");
function cleanImagesArray2(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x.url === "string" && x.url.trim()).map((x, idx) => ({
    url: String(x.url).trim(),
    alt: String(x.alt || "").trim(),
    kind: String(x.kind || "gallery").trim() || "gallery",
    sort_order: x.sort_order === void 0 || x.sort_order === null || x.sort_order === "" ? idx : Number(x.sort_order)
  }));
}
__name(cleanImagesArray2, "cleanImagesArray");
async function onRequest2(context) {
  const { request, env, params } = context;
  const slug = params?.slug;
  if (!slug) return json8({ ok: false, error: "Missing slug" }, 400);
  if (request.method === "GET") {
    try {
      const profile = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      if (!profile) return json8({ ok: false, error: "Not found" }, 404);
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
      return json8({ ok: true, profile: normalized, images, documents });
    } catch (err) {
      console.error("PROFILE GET ERROR:", err);
      return json8({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "PUT") {
    const gate = await requireAdmin6(request, env);
    if (!gate.ok) return json8({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json8({ ok: false, error: "Invalid JSON" }, 400);
    }
    try {
      const existing = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      if (!existing) return json8({ ok: false, error: "Not found" }, 404);
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
      const ts = nowIso2();
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
      return json8({ ok: true, profile: normalized });
    } catch (err) {
      console.error("PROFILE PUT ERROR:", err);
      return json8({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json8({ ok: false, error: "Method not allowed" }, 405);
}
__name(onRequest2, "onRequest");

// api/collections/index.js
var CORS_HEADERS6 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json9(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS6, ...extraHeaders }
  });
}
__name(json9, "json");
function slugify2(input) {
  return String(input || "").trim().toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
__name(slugify2, "slugify");
async function requireAdmin7(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin7, "requireAdmin");
async function onRequestOptions6() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS6 } });
}
__name(onRequestOptions6, "onRequestOptions");
async function onRequestGet4({ env }) {
  try {
    const res = await env.DB.prepare(
      "SELECT id, name, tagline, description, badge, sort_order, is_active, images_json, created_at, updated_at FROM collections WHERE is_active=1 ORDER BY COALESCE(sort_order, 999999), created_at ASC"
    ).all();
    return json9({ ok: true, collections: res?.results || [] });
  } catch (err) {
    console.error("COLLECTIONS LIST ERROR:", err);
    return json9({ ok: false, error: "Server error." }, 500);
  }
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost6({ request, env }) {
  const auth = await requireAdmin7(request, env);
  if (!auth.ok) return json9({ ok: false, error: auth.error }, auth.status);
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json9({ ok: false, error: "Invalid JSON body." }, 400);
  }
  const name = String(payload.name || "").trim();
  if (!name) return json9({ ok: false, error: "Name is required." }, 400);
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
    return json9({ ok: true, collection: row }, 201);
  } catch (err) {
    console.error("COLLECTION CREATE ERROR:", err);
    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("unique") || msg.includes("constraint")) {
      return json9({ ok: false, error: "A collection with that Id/Slug already exists." }, 409);
    }
    if (msg.includes("no such column") && msg.includes("images_json")) {
      return json9(
        { ok: false, error: "DB is missing images_json. Run migration 0005_collections_images_column.sql." },
        500
      );
    }
    return json9({ ok: false, error: "Server error." }, 500);
  }
}
__name(onRequestPost6, "onRequestPost");

// ../.wrangler/tmp/pages-QtwLSb/functionsRoutes-0.38572614097343383.mjs
var routes = [
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
    routePath: "/api/collections/:id/profiles",
    mountPath: "/api/collections/:id",
    method: "",
    middlewares: [],
    modules: [onRequest]
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
    modules: [onRequest2]
  },
  {
    routePath: "/api/collections",
    mountPath: "/api/collections",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/collections",
    mountPath: "/api/collections",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions6]
  },
  {
    routePath: "/api/collections",
    mountPath: "/api/collections",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  }
];

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
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

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
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

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// ../.wrangler/tmp/bundle-a6DyPC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
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

// ../.wrangler/tmp/bundle-a6DyPC/middleware-loader.entry.ts
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
//# sourceMappingURL=functionsWorker-0.7684550668752166.mjs.map
