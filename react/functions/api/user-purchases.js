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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }) {
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookie(cookieHeader);
    const token = cookies?.el_session || '';
    const user = await getUserFromSession(env, token);

    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const res = await env.DB.prepare(
      `SELECT
         id,
         items,
         total_amount,
         purchased_at,
         stripe_payment_id,
         stripe_session_id,
         payment_status,
         customer_email,
         currency,
         shipping_name,
         shipping_address
       FROM purchases
       WHERE user_id = ?
       ORDER BY purchased_at DESC`
    ).bind(user.id).all();

    return json({ ok: true, purchases: res?.results || [] });
  } catch (err) {
    console.error('USER PURCHASES ERROR:', err);
    return json({ ok: false, error: 'Server error.' }, 500);
  }
}