var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-953dEt/functionsWorker-0.43318490579888747.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var encoder = new TextEncoder();
function json(status, data, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  return new Response(JSON.stringify(data), { status, headers });
}
__name(json, "json");
__name2(json, "json");
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
__name(normalizeEmail, "normalizeEmail");
__name2(normalizeEmail, "normalizeEmail");
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
__name2(cookieOptions, "cookieOptions");
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
__name2(setCookie, "setCookie");
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
__name2(parseCookie, "parseCookie");
function randomToken(byteLen = 32) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomToken, "randomToken");
__name2(randomToken, "randomToken");
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
__name2(hashPassword, "hashPassword");
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
__name2(verifyPassword, "verifyPassword");
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
__name2(getUserFromSession, "getUserFromSession");
function toHex(u8) {
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
__name2(toHex, "toHex");
function fromHex(hex) {
  const clean = String(hex || "").trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
__name(fromHex, "fromHex");
__name2(fromHex, "fromHex");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
__name2(timingSafeEqual, "timingSafeEqual");
function json2(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
__name(json2, "json2");
__name2(json2, "json");
function slugify(input) {
  return String(input || "").trim().toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
__name(slugify, "slugify");
__name2(slugify, "slugify");
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
__name2(nowIso, "nowIso");
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
__name2(requireAdmin, "requireAdmin");
async function onRequest(context) {
  const { request, env, params } = context;
  const id = params?.id;
  if (!id) return json2({ ok: false, error: "Missing collection id" }, 400);
  if (request.method === "GET") {
    try {
      const res = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE collection_id=? AND is_active=1 ORDER BY COALESCE(sort_order, 999999), created_at ASC"
      ).bind(id).all();
      return json2({ ok: true, profiles: res?.results || [] });
    } catch (err) {
      console.error("PROFILES GET ERROR:", err);
      return json2({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "POST") {
    const gate = await requireAdmin(request, env);
    if (!gate.ok) return json2({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json2({ ok: false, error: "Invalid JSON" }, 400);
    }
    const name = String(body?.name || "").trim();
    if (!name) return json2({ ok: false, error: "Name is required" }, 400);
    const slug = slugify(body?.slug || name);
    if (!slug) return json2({ ok: false, error: "Slug is required" }, 400);
    const flavor_type = String(body?.flavor_type || "").trim();
    const flavor_category = String(body?.flavor_category || "").trim();
    const description = String(body?.description || "").trim();
    const mood = String(body?.mood || "").trim();
    const dominant_terpenes = Array.isArray(body?.dominant_terpenes) ? JSON.stringify(body.dominant_terpenes) : JSON.stringify([]);
    const flavor_aroma = Array.isArray(body?.flavor_aroma) ? JSON.stringify(body.flavor_aroma) : JSON.stringify([]);
    const sort_order = body?.sort_order === void 0 || body?.sort_order === null || body?.sort_order === "" ? null : Number(body.sort_order);
    const idVal = crypto.randomUUID();
    const ts = nowIso();
    try {
      const col = await env.DB.prepare("SELECT id FROM collections WHERE id=?").bind(id).first();
      if (!col) return json2({ ok: false, error: "Collection not found" }, 404);
      const existing = await env.DB.prepare("SELECT id FROM flavor_profiles WHERE slug=?").bind(slug).first();
      if (existing) return json2({ ok: false, error: "Slug already exists" }, 409);
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
      const created = await env.DB.prepare(
        "SELECT id, collection_id, slug, name, sort_order, is_active, created_at, updated_at FROM flavor_profiles WHERE id=?"
      ).bind(idVal).first();
      return json2({ ok: true, profile: created }, 201);
    } catch (err) {
      console.error("PROFILES POST ERROR:", err);
      return json2({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json2({ ok: false, error: "Method not allowed" }, 405);
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var SESSION_COOKIE = "el_session";
var SESSION_TTL_MS = 1e3 * 60 * 60 * 24 * 14;
async function onRequestPost(context) {
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
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
var SESSION_COOKIE2 = "el_session";
async function onRequestPost2(context) {
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
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
var SESSION_COOKIE3 = "el_session";
async function onRequestGet(context) {
  const cookies = parseCookie(context.request.headers.get("Cookie"));
  const token = cookies[SESSION_COOKIE3];
  const user = await getUserFromSession(context.env, token);
  return json(200, { ok: true, user: user || null });
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost3(context) {
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
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
function json3(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}
__name(json3, "json3");
__name2(json3, "json");
function badRequest(msg) {
  return json3({ ok: false, error: msg }, 400);
}
__name(badRequest, "badRequest");
__name2(badRequest, "badRequest");
function notFound(msg = "Not found") {
  return json3({ ok: false, error: msg }, 404);
}
__name(notFound, "notFound");
__name2(notFound, "notFound");
async function onRequestGet2(context) {
  const { env, params } = context;
  const id = params?.id;
  if (!id) return badRequest("Missing collection id.");
  try {
    const row = await env.DB.prepare("SELECT id, name, tagline, description, badge, sort_order, is_active, created_at, updated_at FROM collections WHERE id = ? AND is_active = 1").bind(id).first();
    if (!row) return notFound("Collection not found.");
    return json3({ ok: true, collection: row });
  } catch (err) {
    console.error("COLLECTION GET ERROR:", err);
    return json3({ ok: false, error: "Server error." }, 500);
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
function json4(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}
__name(json4, "json4");
__name2(json4, "json");
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso2, "nowIso2");
__name2(nowIso2, "nowIso");
async function requireAdmin2(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if ((user.role || "user") !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user };
}
__name(requireAdmin2, "requireAdmin2");
__name2(requireAdmin2, "requireAdmin");
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
__name2(asJsonTextArray, "asJsonTextArray");
function parseJsonArray(text) {
  try {
    const v = JSON.parse(text || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
__name(parseJsonArray, "parseJsonArray");
__name2(parseJsonArray, "parseJsonArray");
async function onRequest2(context) {
  const { request, env, params } = context;
  const slug = params?.slug;
  if (!slug) return json4({ ok: false, error: "Missing slug" }, 400);
  if (request.method === "GET") {
    try {
      const profile = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      if (!profile) return json4({ ok: false, error: "Not found" }, 404);
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
      return json4({ ok: true, profile: normalized, images, documents });
    } catch (err) {
      console.error("PROFILE GET ERROR:", err);
      return json4({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  if (request.method === "PUT") {
    const gate = await requireAdmin2(request, env);
    if (!gate.ok) return json4({ ok: false, error: gate.error }, gate.status);
    let body = null;
    try {
      body = await request.json();
    } catch {
      return json4({ ok: false, error: "Invalid JSON" }, 400);
    }
    try {
      const existing = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      if (!existing) return json4({ ok: false, error: "Not found" }, 404);
      const name = body?.name !== void 0 ? String(body.name).trim() : existing.name;
      const flavor_type = body?.flavor_type !== void 0 ? String(body.flavor_type).trim() : existing.flavor_type || "";
      const flavor_category = body?.flavor_category !== void 0 ? String(body.flavor_category).trim() : existing.flavor_category || "";
      const description = body?.description !== void 0 ? String(body.description).trim() : existing.description || "";
      const mood = body?.mood !== void 0 ? String(body.mood).trim() : existing.mood || "";
      const dominant_terpenes = body?.dominant_terpenes !== void 0 ? asJsonTextArray(body.dominant_terpenes) : existing.dominant_terpenes || "[]";
      const flavor_aroma = body?.flavor_aroma !== void 0 ? asJsonTextArray(body.flavor_aroma) : existing.flavor_aroma || "[]";
      const sort_order = body?.sort_order === void 0 ? existing.sort_order : body.sort_order === null || body.sort_order === "" ? null : Number(body.sort_order);
      const is_active = body?.is_active === void 0 ? existing.is_active : body.is_active ? 1 : 0;
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
      const updated = await env.DB.prepare(
        "SELECT * FROM flavor_profiles WHERE slug=? LIMIT 1"
      ).bind(slug).first();
      const normalized = {
        ...updated,
        dominant_terpenes: parseJsonArray(updated.dominant_terpenes),
        flavor_aroma: parseJsonArray(updated.flavor_aroma)
      };
      return json4({ ok: true, profile: normalized });
    } catch (err) {
      console.error("PROFILE PUT ERROR:", err);
      return json4({ ok: false, error: String(err?.message || err) }, 500);
    }
  }
  return json4({ ok: false, error: "Method not allowed" }, 405);
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var routes = [
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
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/auth/register",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/collections/:id",
    mountPath: "/api/collections",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/profiles/:slug",
    mountPath: "/api/profiles",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  }
];
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
__name2(lexer, "lexer");
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
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
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
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
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
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
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
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
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
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
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
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
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
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
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
          passThroughOnException: /* @__PURE__ */ __name2(() => {
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
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
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
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
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
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
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
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
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
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
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
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
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
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-0kzRaj/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-0kzRaj/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
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
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
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
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.43318490579888747.js.map
