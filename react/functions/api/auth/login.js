import {
  json,
  normalizeEmail,
  verifyPassword,
  randomToken,
  setCookie,
  cookieOptions,
  parseCookie,
} from "../../_lib/auth.js";

const SESSION_COOKIE = "el_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export async function onRequestPost(context) {
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
    )
      .bind(email)
      .first();

    if (!user) return json(401, { ok: false, error: "Invalid email or password." });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return json(401, { ok: false, error: "Invalid email or password." });

    // Create session
    const createdAt = new Date().toISOString();
    const sessionToken = randomToken(32);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await env.DB.prepare(
      "INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(user.id, sessionToken, sessionExpiresAt, createdAt)
      .run();

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
