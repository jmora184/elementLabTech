import { parseCookie, getUserFromSession } from '../_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  try {
    const res = await env.DB.prepare(
      `SELECT
         p.id,
         p.user_id,
         p.items,
         p.total_amount,
         p.purchased_at,
         p.stripe_payment_id,
         p.stripe_session_id,
         p.payment_status,
         p.customer_email,
         p.currency,
         p.shipping_name,
         p.shipping_address,
         p.order_status,
         p.tracking_number,
         p.carrier,
         u.email AS user_email
       FROM purchases p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.purchased_at DESC, p.id DESC`
    ).all();

    return json({ ok: true, orders: res?.results || [] });
  } catch (err) {
    console.error('ADMIN ORDERS LIST ERROR:', err);
    return json({ ok: false, error: 'Server error loading orders.' }, 500);
  }
}
