import Stripe from 'stripe';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
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

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildItemsFromLineItems(lineItems) {
  return (Array.isArray(lineItems) ? lineItems : [])
    .map((line) => ({
      name: String(line?.description || line?.price?.product?.name || 'Item'),
      profileName: String(line?.description || line?.price?.product?.name || 'Item'),
      quantity: Math.max(1, Number(line?.quantity || 1)),
      unitPrice: Number.isFinite(Number(line?.amount_subtotal))
        ? Number(line.amount_subtotal) / 100 / Math.max(1, Number(line?.quantity || 1))
        : null,
      lineTotal: Number.isFinite(Number(line?.amount_total)) ? Number(line.amount_total) / 100 : null,
      currency: String(line?.currency || '').toUpperCase() || null,
    }))
    .filter((item) => item.quantity > 0);
}

async function getPurchaseColumns(env) {
  const tableInfo = await env.DB.prepare('PRAGMA table_info(purchases)').all();
  const rows = Array.isArray(tableInfo?.results) ? tableInfo.results : [];
  return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
}

function hasColumn(columns, name) {
  return columns.has(name);
}

function shippingSummaryFromDetails(shippingDetails, shippingName) {
  const address = shippingDetails?.address || null;
  if (!address) return null;

  return [
    shippingName || shippingDetails?.name || null,
    address.line1 || null,
    address.line2 || null,
    [address.city || null, address.state || null].filter(Boolean).join(', ') || null,
    [address.postal_code || null, address.country || null].filter(Boolean).join(' ') || null,
  ]
    .filter(Boolean)
    .join(', ');
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const secretKey = String(env?.STRIPE_SECRET_KEY || '').trim();
    const webhookSecret = String(env?.STRIPE_WEBHOOK_SECRET || '').trim();

    if (!secretKey) {
      return json({ ok: false, error: 'Missing STRIPE_SECRET_KEY on the server.' }, 500);
    }

    if (!webhookSecret) {
      return json({ ok: false, error: 'Missing STRIPE_WEBHOOK_SECRET on the server.' }, 500);
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return json({ ok: false, error: 'Missing Stripe-Signature header.' }, 400);
    }

    const payload = await request.text();
    const stripe = new Stripe(secretKey);

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
    } catch (err) {
      console.error('STRIPE WEBHOOK VERIFY ERROR:', err);
      return json({ ok: false, error: `Webhook signature verification failed: ${String(err?.message || err)}` }, 400);
    }

    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded' &&
      event.type !== 'checkout.session.async_payment_failed'
    ) {
      return json({ ok: true, ignored: true, eventType: event.type });
    }

    const sessionFromEvent = event.data.object || {};
    const stripeSessionId = String(sessionFromEvent?.id || '').trim();
    if (!stripeSessionId) {
      return json({ ok: false, error: 'Missing Checkout Session ID on the webhook event.' }, 400);
    }

    const columns = await getPurchaseColumns(env);

    let session = sessionFromEvent;
    try {
      session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ['line_items.data.price.product'],
      });
    } catch (err) {
      console.warn('Could not re-retrieve Checkout Session with expanded line items:', err?.message || err);
    }

    const shippingDetails =
      session?.shipping_details ||
      session?.collected_information?.shipping_details ||
      null;

    const metadataItems = safeJsonParse(String(session?.metadata?.items || '[]'), []);
    const lineItems = Array.isArray(session?.line_items?.data) ? session.line_items.data : [];
    const normalizedItems = Array.isArray(metadataItems) && metadataItems.length
      ? metadataItems
      : buildItemsFromLineItems(lineItems);

    const userId = Number(session?.metadata?.user_id || 0);
    const totalAmount = Number(session?.amount_total || 0) / 100;
    const currency = String(session?.currency || 'usd').toUpperCase();
    const stripePaymentId = String(session?.payment_intent || session?.id || '');
    const paymentStatus = String(session?.payment_status || '').trim() || (event.type === 'checkout.session.async_payment_failed' ? 'failed' : '');
    const customerEmail = String(session?.customer_details?.email || session?.customer_email || '').trim() || null;
    const shippingName = String(shippingDetails?.name || session?.customer_details?.name || '').trim() || null;
    const shippingAddressJson = shippingDetails ? JSON.stringify(shippingDetails) : null;
    const shippingAddressSummary = shippingSummaryFromDetails(shippingDetails, shippingName);
    const orderStatus = paymentStatus === 'paid'
      ? 'processing'
      : paymentStatus === 'failed'
        ? 'payment_failed'
        : 'pending_payment';

    if (!userId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      return json({ ok: false, error: 'Missing required checkout session fields.' }, 400);
    }

    const duplicateLookupField = hasColumn(columns, 'stripe_session_id') ? 'stripe_session_id' : 'stripe_payment_id';
    const duplicateLookupValue = duplicateLookupField === 'stripe_session_id' ? stripeSessionId : stripePaymentId;

    if (duplicateLookupValue) {
      const existing = await env.DB.prepare(
        `SELECT id FROM purchases WHERE ${duplicateLookupField} = ? LIMIT 1`
      ).bind(duplicateLookupValue).first();

      if (existing?.id) {
        if (event.type === 'checkout.session.async_payment_failed' && hasColumn(columns, 'payment_status')) {
          const updates = [];
          const bindings = [];

          updates.push('payment_status = ?');
          bindings.push('failed');

          if (hasColumn(columns, 'order_status')) {
            updates.push('order_status = ?');
            bindings.push('payment_failed');
          }

          if (hasColumn(columns, 'order_status_updated_at')) {
            updates.push('order_status_updated_at = CURRENT_TIMESTAMP');
          }

          bindings.push(existing.id);

          await env.DB.prepare(`UPDATE purchases SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
        }

        return json({ ok: true, duplicate: true, purchaseId: existing.id, eventType: event.type });
      }
    }

    const insertColumns = [];
    const placeholders = [];
    const bindings = [];

    const addValue = (name, value, options = {}) => {
      if (!hasColumn(columns, name)) return;
      insertColumns.push(name);
      if (options.rawSql) {
        placeholders.push(options.rawSql);
      } else {
        placeholders.push('?');
        bindings.push(value);
      }
    };

    addValue('user_id', userId);
    addValue('items', JSON.stringify(normalizedItems));
    addValue('total_amount', totalAmount.toFixed(2));
    addValue('purchased_at', null, { rawSql: 'CURRENT_TIMESTAMP' });
    addValue('stripe_payment_id', stripePaymentId || null);
    addValue('stripe_session_id', stripeSessionId || null);
    addValue('payment_status', paymentStatus || null);
    addValue('customer_email', customerEmail);
    addValue('currency', currency);
    addValue('shipping_name', shippingName);
    addValue('shipping_address', shippingAddressJson);
    addValue('shipping_address1', shippingAddressSummary);
    addValue('order_status', orderStatus);
    addValue('order_status_updated_at', null, { rawSql: 'CURRENT_TIMESTAMP' });

    if (!insertColumns.length) {
      return json({ ok: false, error: 'Purchases table is missing required columns.' }, 500);
    }

    const result = await env.DB.prepare(
      `INSERT INTO purchases (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`
    ).bind(...bindings).run();

    return json({
      ok: true,
      inserted: true,
      id: result?.meta?.last_row_id || null,
      eventType: event.type,
    });
  } catch (err) {
    console.error('STRIPE WEBHOOK ERROR:', err);
    return json({ ok: false, error: String(err?.message || 'Server error processing Stripe webhook.') }, 500);
  }
}
