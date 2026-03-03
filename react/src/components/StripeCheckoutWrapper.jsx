import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StripeCheckoutWrapper({ items, totalAmount, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm items={items} totalAmount={totalAmount} onSuccess={onSuccess} />
    </Elements>
  );
}
