// functions/api/collections/[id]/documents/upload.js
// Route: /api/collections/:id/documents/upload
//
// POST (admin-only): accepts multipart/form-data with fields:
// - file: the document Blob
// - title: optional title
// - type: optional type (COA, SDS, spec, etc.)
//
// Stores the file in R2 (binding: DOCS_BUCKET) and appends an entry to collections.documents_json.
//
// Notes:
// - This keeps the DB schema simple (documents_json already exists).
// - Download uses a separate endpoint that streams from R2 by docId.

import { parseCookie, getUserFromSession } from "../../../../_lib/auth.js";

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

function safeJsonArray(text) {
  if (!text) return [];
  if (Array.isArray(text)) return text;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeFileName(name) {
  const base = String(name || "document").replace(/[/\\?%*:|"<>]/g, "_");
  return base.length > 120 ? base.slice(0, 120) : base;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export async function onRequestPost({ request, env, params }) {
  const id = params?.id;
  if (!id) return json({ ok: false, error: "Missing collection id." }, 400);

  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  if (!env.DOCS_BUCKET) {
    return json(
      {
        ok: false,
        error:
          "R2 bucket binding missing. Add an R2 bucket binding named DOCS_BUCKET in Cloudflare Pages + wrangler.jsonc.",
      },
      500
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Expected multipart/form-data." }, 400);
  }

  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const type = String(form.get("type") || "").trim();

  if (!file || typeof file === "string") {
    return json({ ok: false, error: "Missing file field." }, 400);
  }

  // Basic size guard (25 MB)
  const maxBytes = 25 * 1024 * 1024;
  if (file.size && file.size > maxBytes) {
    return json({ ok: false, error: "File too large (max 25MB)." }, 413);
  }

  // Ensure collection exists + get current documents_json
  const row = await env.DB.prepare("SELECT documents_json FROM collections WHERE id=?").bind(id).first();
  if (!row) return json({ ok: false, error: "Collection not found." }, 404);

  const docId = crypto.randomUUID();
  const fileName = sanitizeFileName(file.name || "document");
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const key = `collections/${id}/${docId}${ext ? "." + ext : ""}`;

  const contentType = file.type || "application/octet-stream";
  const buf = await file.arrayBuffer();

  try {
    await env.DOCS_BUCKET.put(key, buf, {
      httpMetadata: { contentType },
      customMetadata: {
        collection_id: id,
        doc_id: docId,
        title: title || fileName,
        type: type || "",
      },
    });
  } catch (err) {
    console.error("R2 PUT ERROR:", err);
    return json({ ok: false, error: "Failed to store file." }, 502);
  }

  const docs = safeJsonArray(row.documents_json);
  const entry = {
    id: docId,
    title: title || fileName,
    type: type || "",
    fileName,
    contentType,
    size: Number(file.size || buf.byteLength || 0),
    key,
    created_at: new Date().toISOString(),
  };
  docs.push(entry);

  try {
    await env.DB.prepare("UPDATE collections SET documents_json=?, updated_at=datetime('now') WHERE id=?")
      .bind(JSON.stringify(docs), id)
      .run();
  } catch (err) {
    console.error("DB UPDATE ERROR:", err);
    // Roll back the stored object if DB write fails
    try { await env.DOCS_BUCKET.delete(key); } catch {}
    return json({ ok: false, error: "Failed to update database." }, 500);
  }

  return json({
    ok: true,
    doc: {
      ...entry,
      url: `/api/collections/${id}/documents/${docId}/download`,
    },
    documents: docs,
  });
}
