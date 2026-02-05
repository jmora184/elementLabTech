// functions/_lib/auth.js
// Worker-safe auth helpers: JSON responses, cookies, WebCrypto password hashing (PBKDF2),
// sessions lookup, and small utilities.

const encoder = new TextEncoder();

/**
 * Return JSON Response with status
 */
export function json(status, data, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Normalize email
 */
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Cookie options builder
 */
export function cookieOptions(opts = {}) {
  const defaults = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  };
  return { ...defaults, ...opts };
}

/**
 * Set-Cookie helper
 */
export function setCookie(headers, name, value, options = {}) {
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

/**
 * Parse Cookie header -> object
 */
export function parseCookie(cookieHeader) {
  const out = {};
  const str = cookieHeader || "";
  str.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

/**
 * Random token (URL-safe-ish hex)
 */
export function randomToken(byteLen = 32) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * IMPORTANT: Cloudflare PBKDF2 iteration cap
 * Cloudflare Workers WebCrypto PBKDF2 supports up to 100,000 iterations.
 * We use 100,000 as the default to avoid runtime errors in production.
 */
const DEFAULT_PBKDF2_ITERS = 100_000;

/**
 * Password hashing: PBKDF2 using WebCrypto.
 * Stored format: pbkdf2$<iters>$<saltHex>$<hashHex>
 */
export async function hashPassword(password, iters = DEFAULT_PBKDF2_ITERS) {
  const safeIters = Math.min(Number(iters) || DEFAULT_PBKDF2_ITERS, 100_000);

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
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hash = new Uint8Array(bits);
  return `pbkdf2$${safeIters}$${toHex(salt)}$${toHex(hash)}`;
}

/**
 * Verify password
 */
export async function verifyPassword(password, stored) {
  try {
    const [alg, itersStr, saltHex, hashHex] = String(stored || "").split("$");
    if (alg !== "pbkdf2") return false;

    const iters = Math.min(Number(itersStr) || DEFAULT_PBKDF2_ITERS, 100_000);
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
        hash: "SHA-256",
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

/**
 * Get user from session cookie token (el_session)
 */
export async function getUserFromSession(env, sessionToken) {
  if (!env?.DB || !sessionToken) return null;

  const row = await env.DB.prepare(
    `
    SELECT u.id as id, u.email as email, s.expires_at as expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
    LIMIT 1
  `
  )
    .bind(sessionToken)
    .first();

  if (!row) return null;

  // check expiry
  const exp = Date.parse(row.expires_at);
  if (Number.isFinite(exp) && exp < Date.now()) return null;

  return { id: row.id, email: row.email };
}

/* ---------- helpers ---------- */

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
