import { parseCookie, getUserFromSession } from '../_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      `SELECT id, title, message, image_url, attachment_url, created_at
       FROM blog_posts
       ORDER BY datetime(created_at) DESC, id DESC`
    ).all();

    return json(result?.results || []);
  } catch (err) {
    console.error('BLOG LIST ERROR:', err);
    return json({ ok: false, error: 'Server error loading blog posts.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

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
    const createdAt = new Date().toISOString();
    const inserted = await env.DB.prepare(
      `INSERT INTO blog_posts (title, message, image_url, attachment_url, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(title, message, imageUrl, attachmentUrl, createdAt).run();

    const newId = inserted?.meta?.last_row_id;
    const post = newId
      ? await env.DB.prepare(
          `SELECT id, title, message, image_url, attachment_url, created_at
           FROM blog_posts
           WHERE id = ?
           LIMIT 1`
        ).bind(newId).first()
      : null;

    return json({ ok: true, post }, 201);
  } catch (err) {
    console.error('BLOG CREATE ERROR:', err);
    return json({ ok: false, error: 'Server error creating blog post.' }, 500);
  }
}
