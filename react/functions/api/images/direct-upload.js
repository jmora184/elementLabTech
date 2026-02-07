// functions/api/images/direct-upload.js
// POST: create a one-time Cloudflare Images direct upload URL (admin-only)
// Route: /api/images/direct-upload

import { parseCookie, getUserFromSession } from "../../_lib/auth.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export async function onRequestPost({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (!gate.ok) return json({ ok: false, error: gate.error }, gate.status);

  const accountId = env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) {
    return json(
      {
        ok: false,
        error:
          "Missing Cloudflare Images env vars. Set CF_IMAGES_ACCOUNT_ID and CF_IMAGES_API_TOKEN in Pages settings.",
      },
      500
    );
  }

  // Optional request body: { metadata?: object }
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const form = new FormData();
// Cloudflare's v2 direct_upload endpoint expects multipart/form-data fields (not JSON).
// metadata must be a JSON string if provided.
if (body?.metadata) {
  try {
    form.append("metadata", JSON.stringify(body.metadata));
  } catch {
    // ignore bad metadata
  }
}
// We are using public delivery URLs in the app, so we don't require signed URLs.
form.append("requireSignedURLs", "false");

const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: form,
    }
  );


  const data = await cfRes.json().catch(() => null);
  if (!cfRes.ok || !data?.success) {
    console.error("CF IMAGES DIRECT UPLOAD ERROR:", cfRes.status, data);
    const msg = data?.errors?.[0]?.message || `Cloudflare Images error (${cfRes.status})`;
    return json({ ok: false, error: msg }, 502);
  }

  return json({ ok: true, id: data.result?.id, uploadURL: data.result?.uploadURL });
}
