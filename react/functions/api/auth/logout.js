import { parseCookie, setCookie, json } from "../../_lib/auth.js";

const SESSION_COOKIE = "el_session";

export async function onRequestPost(context) {
  try {
    const cookies = parseCookie(context.request.headers.get("Cookie"));
    const token = cookies[SESSION_COOKIE];

    if (token) {
      await context.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    }

    const clear = setCookie(SESSION_COOKIE, "", { maxAge: 0 });

    return json(200, { ok: true }, { "Set-Cookie": clear });
  } catch {
    const clear = setCookie(SESSION_COOKIE, "", { maxAge: 0 });
    return json(200, { ok: true }, { "Set-Cookie": clear });
  }
}
