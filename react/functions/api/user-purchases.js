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

async function getPurchaseColumns(env) {
  const tableInfo = await env.DB.prepare('PRAGMA table_info(purchases)').all();
  const rows = Array.isArray(tableInfo?.results) ? tableInfo.results : [];
  return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
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

    const columns = await getPurchaseColumns(env);

    const selectParts = [
      'id',
      'items',
      'total_amount',
      'purchased_at',
      'stripe_payment_id',
      hasColumn(columns, 'stripe_session_id') ? 'stripe_session_id' : 'NULL AS stripe_session_id',
      hasColumn(columns, 'payment_status') ? 'payment_status' : 'NULL AS payment_status',
      hasColumn(columns, 'customer_email') ? 'customer_email' : 'NULL AS customer_email',
      hasColumn(columns, 'currency') ? 'currency' : 'NULL AS currency',
      hasColumn(columns, 'shipping_name') ? 'shipping_name' : 'NULL AS shipping_name',
      hasColumn(columns, 'shipping_address') ? 'shipping_address' : 'NULL AS shipping_address',
      hasColumn(columns, 'shipping_address1') ? 'shipping_address1' : 'NULL AS shipping_address1',
      hasColumn(columns, 'order_status') ? 'order_status' : 'NULL AS order_status',
      hasColumn(columns, 'order_status_updated_at') ? 'order_status_updated_at' : 'NULL AS order_status_updated_at',
      hasColumn(columns, 'tracking_number') ? 'tracking_number' : 'NULL AS tracking_number',
      hasColumn(columns, 'carrier') ? 'carrier' : 'NULL AS carrier',
      hasColumn(columns, 'shipped_at') ? 'shipped_at' : 'NULL AS shipped_at',
    ];

    const res = await env.DB.prepare(
      `SELECT ${selectParts.join(', ')}
       FROM purchases
       WHERE user_id = ?
       ORDER BY purchased_at DESC, id DESC`
    ).bind(user.id).all();

    return json({
      ok: true,
      purchases: res?.results || [],
      availableColumns: [...columns],
    });
  } catch (err) {
    console.error('USER PURCHASES ERROR:', err);
    return json({ ok: false, error: 'Server error.' }, 500);
  }
}

function hasColumn(columns, name) {
  return columns.has(name);
}
