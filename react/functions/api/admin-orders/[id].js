import { parseCookie, getUserFromSession } from '../../_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ALLOWED_STATUSES = new Set(['processing', 'shipped', 'delivered', 'cancelled']);

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

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Processing';
  if (!ALLOWED_STATUSES.has(raw)) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const orderId = Number(params?.id || 0);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return json({ ok: false, error: 'Invalid order id.' }, 400);
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const orderStatus = normalizeStatus(payload.order_status);
  if (!orderStatus) {
    return json({ ok: false, error: 'Invalid order status.' }, 400);
  }

  const trackingNumber = String(payload.tracking_number || '').trim().slice(0, 120) || null;
  const carrier = String(payload.carrier || '').trim().slice(0, 80) || null;

  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM purchases WHERE id = ? LIMIT 1`
    ).bind(orderId).first();

    if (!existing?.id) {
      return json({ ok: false, error: 'Order not found.' }, 404);
    }

    await env.DB.prepare(
      `UPDATE purchases
       SET order_status = ?, tracking_number = ?, carrier = ?
       WHERE id = ?`
    ).bind(orderStatus, trackingNumber, carrier, orderId).run();

    const updated = await env.DB.prepare(
      `SELECT
         id,
         order_status,
         tracking_number,
         carrier,
         payment_status,
         stripe_payment_id,
         purchased_at,
         total_amount,
         currency,
         shipping_name,
         shipping_address,
         customer_email,
         user_id,
         items
       FROM purchases
       WHERE id = ?
       LIMIT 1`
    ).bind(orderId).first();

    return json({ ok: true, order: updated });
  } catch (err) {
    console.error('ADMIN ORDER UPDATE ERROR:', err);
    return json({ ok: false, error: 'Server error updating order.' }, 500);
  }
}
