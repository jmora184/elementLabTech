// functions/api/stripe-webhook.js
// Stripe webhook endpoint for payment events
// Listens for checkout.session.completed and saves purchase to DB

const STRIPE_SECRET_KEY = typeof STRIPE_SECRET_KEY !== 'undefined' ? STRIPE_SECRET_KEY : undefined;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function onRequestPost({ request, env }) {
  // Read raw body for Stripe signature verification
  const rawBody = await request.arrayBuffer();
  const sig = request.headers.get("stripe-signature");
  if (!STRIPE_SECRET_KEY) return json({ ok: false, error: "Stripe secret key not set." }, 500);

  let event;
  try {
    // Lazy import stripe (ESM workaround for Cloudflare)
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return json({ ok: false, error: `Webhook signature verification failed: ${err.message}` }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // You should store user_id or email in session.metadata during checkout creation
    const user_id = session.metadata?.user_id || null;
    const items = session.metadata?.items || '[]';
    const total_amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : null;
    const stripe_payment_id = session.payment_intent || session.id;

    if (!user_id || !total_amount) {
      return json({ ok: false, error: "Missing user_id or amount in session metadata." }, 400);
    }

    try {
      await env.DB.prepare(
        `INSERT INTO purchases (user_id, items, total_amount, purchased_at, stripe_payment_id) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`
      ).bind(user_id, items, total_amount, stripe_payment_id).run();
      return json({ ok: true });
    } catch (err) {
      return json({ ok: false, error: `DB error: ${err.message}` }, 500);
    }
  }

  return json({ ok: true, ignored: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
