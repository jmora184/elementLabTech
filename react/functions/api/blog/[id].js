import { parseCookie, getUserFromSession } from '../../_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

async function requireAdmin(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookie(cookieHeader);
  const token = cookies?.el_session || '';
  const user = await getUserFromSession(env, token);

  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };
  if ((user.role || 'user') !== 'admin') return { ok: false, status: 403, error: 'Forbidden' };
  return { ok: true, user };
}

function cleanText(value, maxLen = 0) {
  const out = String(value || '').trim();
  if (!maxLen) return out;
  return out.slice(0, maxLen);
}

function parseId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ env, params }) {
  const id = parseId(params?.id);
  if (!id) return json({ ok: false, error: 'Invalid blog id.' }, 400);

  try {
    const post = await env.DB.prepare(
      `SELECT id, title, message, image_url, attachment_url, created_at
       FROM blog_posts
       WHERE id = ?
       LIMIT 1`
    ).bind(id).first();

    if (!post) return json({ ok: false, error: 'Not found.' }, 404);
    return json(post);
  } catch (err) {
    console.error('BLOG GET ERROR:', err);
    return json({ ok: false, error: 'Server error loading blog post.' }, 500);
  }
}

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const id = parseId(params?.id);
  if (!id) return json({ ok: false, error: 'Invalid blog id.' }, 400);

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const title = cleanText(payload.title, 200);
  const message = cleanText(payload.message);
  const imageUrl = cleanText(payload.image_url || payload.imageUrl, 1200) || null;
  const attachmentUrl = cleanText(payload.attachment_url || payload.attachmentUrl, 1200) || null;

  if (!title) return json({ ok: false, error: 'Title is required.' }, 400);
  if (!message) return json({ ok: false, error: 'Message is required.' }, 400);

  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM blog_posts WHERE id = ? LIMIT 1`
    ).bind(id).first();

    if (!existing?.id) return json({ ok: false, error: 'Not found.' }, 404);

    await env.DB.prepare(
      `UPDATE blog_posts
       SET title = ?, message = ?, image_url = ?, attachment_url = ?
       WHERE id = ?`
    ).bind(title, message, imageUrl, attachmentUrl, id).run();

    const updated = await env.DB.prepare(
      `SELECT id, title, message, image_url, attachment_url, created_at
       FROM blog_posts
       WHERE id = ?
       LIMIT 1`
    ).bind(id).first();

    return json({ ok: true, post: updated });
  } catch (err) {
    console.error('BLOG UPDATE ERROR:', err);
    return json({ ok: false, error: 'Server error updating blog post.' }, 500);
  }
}

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const id = parseId(params?.id);
  if (!id) return json({ ok: false, error: 'Invalid blog id.' }, 400);

  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM blog_posts WHERE id = ? LIMIT 1`
    ).bind(id).first();

    if (!existing?.id) return json({ ok: false, error: 'Not found.' }, 404);

    await env.DB.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(id).run();
    return json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('BLOG DELETE ERROR:', err);
    return json({ ok: false, error: 'Server error deleting blog post.' }, 500);
  }
}
