// functions/api/collections/[id]/documents/[docId]/download.js
// Route: /api/collections/:id/documents/:docId/download
//
// GET: public download endpoint that streams the file from R2 using the key stored in collections.documents_json.

import { parseCookie, getUserFromSession } from "../../../../../_lib/auth.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(headers = {}) {
  return { ...headers, ...CORS_HEADERS };
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: withCors({ "Content-Type": "application/json", ...extraHeaders }),
  });
}

function safeJsonArray(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Optional: if you want to gate downloads to logged-in users, set env.DOCS_REQUIRE_LOGIN="1"
async function requireLoginIfConfigured(request, env) {
  if (String(env.DOCS_REQUIRE_LOGIN || "") !== "1") return { ok: true };
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || "";
  const user = await getUserFromSession(env, token);
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  return { ok: true, user };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: withCors() });
}

export async function onRequestGet({ request, env, params }) {
  const id = params?.id;
  const docId = params?.docId;
  if (!id || !docId) return json({ ok: false, error: "Missing params." }, 400);

  const gate = await requireLoginIfConfigured(request, env);
  if (!gate.ok) return json({ ok: false, error: gate.error }, gate.status);

  if (!env.DOCS_BUCKET) {
    return json({ ok: false, error: "R2 bucket binding missing (DOCS_BUCKET)." }, 500);
  }

  const row = await env.DB.prepare("SELECT documents_json FROM collections WHERE id=?").bind(id).first();
  if (!row) return json({ ok: false, error: "Collection not found." }, 404);

  const docs = safeJsonArray(row.documents_json);
  const doc = docs.find((d) => String(d?.id || "") === String(docId));
  if (!doc) return json({ ok: false, error: "Document not found." }, 404);

  const key = String(doc.key || "");
  if (!key) return json({ ok: false, error: "Document missing key." }, 500);

  let obj;
  try {
    obj = await env.DOCS_BUCKET.get(key);
  } catch (err) {
    console.error("R2 GET ERROR:", err);
    return json({ ok: false, error: "Failed to fetch file." }, 502);
  }

  if (!obj) return json({ ok: false, error: "File not found in storage." }, 404);

  const fileName = String(doc.fileName || doc.title || "document").replace(/[\r\n"]/g, "_");
  const contentType = doc.contentType || obj.httpMetadata?.contentType || "application/octet-stream";

  const headers = new Headers(
    withCors({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    })
  );

  // If R2 stored ETag, include it
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);

  return new Response(obj.body, { status: 200, headers });
}
