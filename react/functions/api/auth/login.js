import { parseCookie, setCookie, verifyPassword, json, randomToken } from "../../_lib/auth.js";

const SESSION_COOKIE = "el_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const emailRaw = (body.email ?? "").toString().trim();
    const password = (body.password ?? "").toString();

    const email = emailRaw.toLowerCase();

    if (!email || !email.includes("@")) return json(400, { ok: false, error: "Valid email required." });
    if (!password) return json(400, { ok: false, error: "Password required." });

    const user = await context.env.DB.prepare(
      `SELECT id, email, pw_algo, pw_iterations, pw_salt_b64, pw_hash_b64
       FROM users WHERE email = ?`
    ).bind(email).first();

    if (!user) return json(401, { ok: false, error: "Invalid email or password." });

    const ok = await verifyPassword(password, {
      algo: user.pw_algo,
      iterations: user.pw_iterations,
      salt_b64: user.pw_salt_b64,
      hash_b64: user.pw_hash_b64,
    });

    if (!ok) return json(401, { ok: false, error: "Invalid email or password." });

    // Create session token
    const token = randomToken();
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

    await context.env.DB.prepare(
      `INSERT INTO sessions (token, user_id, created_at, expires_at)
       VALUES (?, ?, unixepoch(), ?)`
    ).bind(token, user.id, expiresAt).run();

    const cookie = setCookie(SESSION_COOKIE, token, { maxAge: SESSION_TTL_SECONDS });

    return json(200, { ok: true, user: { id: user.id, email: user.email } }, { "Set-Cookie": cookie });
  } catch {
    return json(500, { ok: false, error: "Server error." });
  }
}
