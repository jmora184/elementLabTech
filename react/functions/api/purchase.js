// POST /api/purchase
// Handles checkout and saves purchase record after Stripe payment
import { getUserFromRequest } from '../_lib/auth';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { items, totalAmount, stripePaymentId } = req.body;
  if (!items || !totalAmount || !stripePaymentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate Stripe payment
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId);
    if (
      !paymentIntent ||
      paymentIntent.amount_received !== Math.round(totalAmount * 100) ||
      paymentIntent.status !== 'succeeded'
    ) {
      return res.status(402).json({ error: 'Payment not valid or not completed' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Stripe validation failed', details: err.message });
  }

  // Save purchase record to DB (example using D1/SQLite)
  const db = req.db; // Assume db is attached to req
  await db.run(
    'INSERT INTO purchases (user_id, items, total_amount, stripe_payment_id) VALUES (?, ?, ?, ?)',
    [user.id, JSON.stringify(items), totalAmount, stripePaymentId]
  );

  res.status(201).json({ success: true });
}
