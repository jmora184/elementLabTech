import { parseCookie, json, getUserFromSession } from "../../_lib/auth.js";

const SESSION_COOKIE = "el_session";

export async function onRequestGet(context) {
  const cookies = parseCookie(context.request.headers.get("Cookie"));
  const token = cookies[SESSION_COOKIE];

  const user = await getUserFromSession(context.env, token);
  return json(200, { ok: true, user: user || null });
}
