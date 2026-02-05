import { parseCookie, setCookie, cookieOptions, json } from "../../_lib/auth.js";

const SESSION_COOKIE = "el_session";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const cookies = parseCookie(request.headers.get("Cookie"));
    const token = cookies[SESSION_COOKIE];

    if (token && env?.DB) {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }
  } catch (e) {
    console.error("LOGOUT ERROR:", e);
    // still clear cookie below
  }

  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  setCookie(headers, SESSION_COOKIE, "", cookieOptions({ maxAge: 0 }));

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
