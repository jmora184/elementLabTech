import Stripe from 'stripe';

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
    const secretKey = String(env?.STRIPE_SECRET_KEY || '').trim();
    if (!secretKey) {
      return json({ error: 'Missing STRIPE_SECRET_KEY on the server.' }, 500);
    }

    const url = new URL(request.url);
    const sessionId = String(url.searchParams.get('session_id') || '').trim();
    if (!sessionId) {
      return json({ error: 'Missing session_id.' }, 400);
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email || null,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error('CHECKOUT SESSION STATUS ERROR:', err);
    return json({ error: String(err?.message || 'Server error retrieving checkout session.') }, 500);
  }
}
