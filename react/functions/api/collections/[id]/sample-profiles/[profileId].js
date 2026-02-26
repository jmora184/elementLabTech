import { parseCookie, getUserFromSession } from "../../../../_lib/auth.js";

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
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

export async function onRequest(context) {
  const { request, env, params } = context;
  const collectionId = String(params?.id || "").trim();
  const profileId = String(params?.profileId || "").trim();

  if (!collectionId || !profileId) {
    return json({ ok: false, error: "Missing route params" }, 400);
  }

  if (request.method !== "DELETE") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const gate = await requireAdmin(request, env);
  if (!gate.ok) return json({ ok: false, error: gate.error }, gate.status);

  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM collection_sample_profiles WHERE collection_id=? AND profile_id=? LIMIT 1"
    )
      .bind(collectionId, profileId)
      .first();

    if (!existing) {
      return json({ ok: false, error: "Sample profile link not found" }, 404);
    }

    await env.DB.prepare(
      "DELETE FROM collection_sample_profiles WHERE collection_id=? AND profile_id=?"
    )
      .bind(collectionId, profileId)
      .run();

    return json({ ok: true });
  } catch (err) {
    console.error("SAMPLE PROFILE DELETE ERROR:", err);
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
}
