import Stripe from 'stripe';
import { parseCookie, getUserFromSession } from "../_lib/auth.js";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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

function parseUnitPrice(item) {
  const sizeText = String(item?.size || '');
  const sampleKitLike = /sample\s*kit/i.test(sizeText) || /sample\s*kit/i.test(String(item?.profileName || ''));
  if (sampleKitLike) return 199;

  const match = sizeText.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  const explicitPrice = Number(item?.unitPrice);
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return explicitPrice;

  return 0;
}

function sanitizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
      const unitPrice = parseUnitPrice(item);
      return {
        productId: String(item?.productId || ''),
        collectionName: String(item?.collectionName || 'Element Lab'),
        profileName: String(item?.profileName || 'Custom Product'),
        profileSlug: String(item?.profileSlug || ''),
        size: String(item?.size || ''),
        quantity,
        unitPrice,
      };
    })
    .filter((item) => item.quantity > 0 && item.unitPrice > 0);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    // Authenticate user from session cookie
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = parseCookie(cookieHeader);
    const token = cookies?.el_session || "";
    const user = await getUserFromSession(env, token);
    const secretKey = String(env?.STRIPE_SECRET_KEY || '').trim();
    if (!secretKey) {
      return json({ error: 'Missing STRIPE_SECRET_KEY on the server.' }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const items = sanitizeItems(body?.items);
    if (!items.length) {
      return json({ error: 'Your cart is empty or contains invalid pricing.' }, 400);
    }

    const origin = new URL(request.url).origin;
    const stripe = new Stripe(secretKey);

    const lineItems = items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: {
          name: item.profileName,
          description: [item.collectionName, item.size].filter(Boolean).join(' • '),
          metadata: {
            productId: item.productId,
            profileSlug: item.profileSlug,
          },
        },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/cart?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?checkout=cancel`,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'DE', 'FR', 'NL', 'IT', 'ES', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'PT', 'LU'],
      },
      phone_number_collection: { enabled: true },
      metadata: {
        cart_source: 'cart-page',
        user_id: user?.id ? String(user.id) : '',
        items: JSON.stringify(items),
      },
    });

    return json({ sessionId: session.id, url: session.url || null });
  } catch (err) {
    console.error('CREATE CHECKOUT SESSION ERROR:', err);
    return json({ error: String(err?.message || 'Server error creating checkout session.') }, 500);
  }
}
