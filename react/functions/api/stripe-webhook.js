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

    if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
      return json({ ok: true, ignored: true, eventType: event.type });
    }

    const session = event.data.object;
    const userId = Number(session?.metadata?.user_id || 0);
    const itemsJson = String(session?.metadata?.items || '[]');
    const totalAmount = Number(session?.amount_total || 0) / 100;
    const currency = String(session?.currency || 'usd').toUpperCase();
    const stripePaymentId = String(session?.payment_intent || session?.id || '');
    const stripeSessionId = String(session?.id || '');
    const paymentStatus = String(session?.payment_status || '');
    const customerEmail = String(session?.customer_details?.email || session?.customer_email || '').trim() || null;
    const shippingName = String(session?.shipping_details?.name || '').trim() || null;
    const shippingAddress = session?.shipping_details?.address ? JSON.stringify(session.shipping_details.address) : null;

    if (!userId || !stripeSessionId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      return json({ ok: false, error: 'Missing required checkout session fields.' }, 400);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM purchases WHERE stripe_session_id = ? LIMIT 1'
    ).bind(stripeSessionId).first();

    if (existing?.id) {
      return json({ ok: true, duplicate: true, purchaseId: existing.id });
    }

    const result = await env.DB.prepare(
      `INSERT INTO purchases (
        user_id,
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
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      itemsJson,
      totalAmount.toFixed(2),
      stripePaymentId,
      stripeSessionId,
      paymentStatus,
      customerEmail,
      currency,
      shippingName,
      shippingAddress,
    ).run();

    return json({ ok: true, inserted: true, id: result?.meta?.last_row_id || null });
  } catch (err) {
    console.error('STRIPE WEBHOOK ERROR:', err);
    return json({ ok: false, error: String(err?.message || 'Server error processing Stripe webhook.') }, 500);
  }
}