import {
  json,
  normalizeEmail,
  hashPassword,
  randomToken,
  setCookie,
  cookieOptions,
} from "../../_lib/auth.js";

export async function onRequestPost(context) {
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

    // Ensure DB exists
    if (!env?.DB) {
      return json(500, { ok: false, error: "D1 binding DB is missing (env.DB undefined)." });
    }

    // Check if user exists
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? LIMIT 1"
    )
      .bind(email)
      .first();

    if (existing?.id) {
      return json(409, { ok: false, error: "Email already registered." });
    }

    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    // Create user
    const insertUser = await env.DB.prepare(
      "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)"
    )
      .bind(email, passwordHash, createdAt)
      .run();

    const userId = insertUser?.meta?.last_row_id;

    if (!userId) {
      return json(500, { ok: false, error: "Failed to create user (no userId returned)." });
    }

    // Create session
    const sessionToken = randomToken(32);
    const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(); // 14 days

    await env.DB.prepare(
      "INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, sessionToken, sessionExpiresAt, createdAt)
      .run();

    // Set cookie
    const headers = new Headers({ "Content-Type": "application/json" });
    setCookie(headers, "el_session", sessionToken, cookieOptions());

    return new Response(
      JSON.stringify({ ok: true, user: { id: userId, email } }),
      { status: 200, headers }
    );
  } catch (e) {
    // IMPORTANT: show real error for debugging
    console.error("REGISTER ERROR:", e);
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}
