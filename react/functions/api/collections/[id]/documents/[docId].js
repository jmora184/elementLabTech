// functions/api/collections/[id]/documents/[docId].js
// Route: /api/collections/:id/documents/:docId
//
// DELETE (admin-only): removes doc entry from collections.documents_json and deletes from R2.

import { parseCookie, getUserFromSession } from "../../../../_lib/auth.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS",
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

function safeJsonArray(text) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export async function onRequestDelete({ request, env, params }) {
  const id = params?.id;
  const docId = params?.docId;
  if (!id || !docId) return json({ ok: false, error: "Missing params." }, 400);

  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  if (!env.DOCS_BUCKET) return json({ ok: false, error: "R2 bucket binding missing (DOCS_BUCKET)." }, 500);

  const row = await env.DB.prepare("SELECT documents_json FROM collections WHERE id=?").bind(id).first();
  if (!row) return json({ ok: false, error: "Collection not found." }, 404);

  const docs = safeJsonArray(row.documents_json);
  const idx = docs.findIndex((d) => String(d?.id || "") === String(docId));
  if (idx < 0) return json({ ok: false, error: "Document not found." }, 404);

  const [doc] = docs.splice(idx, 1);
  const key = String(doc?.key || "");

  try {
    await env.DB.prepare("UPDATE collections SET documents_json=?, updated_at=datetime('now') WHERE id=?")
      .bind(JSON.stringify(docs), id)
      .run();
  } catch (err) {
    console.error("DB UPDATE ERROR:", err);
    return json({ ok: false, error: "Failed to update database." }, 500);
  }

  if (key) {
    try {
      await env.DOCS_BUCKET.delete(key);
    } catch (err) {
      // Not fatal; DB already updated.
      console.error("R2 DELETE ERROR:", err);
    }
  }

  return json({ ok: true, deleted: { id: docId } });
}
