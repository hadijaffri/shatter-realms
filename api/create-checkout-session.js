// Vercel Serverless Function for Stripe Checkout
import Stripe from 'stripe';
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

let stripe = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      timeout: 10000,
      maxNetworkRetries: 2,
    });
  }
  return stripe;
}

// Define coin packages
const packages = {
  small: { coins: 500, price: 499, name: 'Small Coin Pack' },
  medium: { coins: 1200, price: 999, name: 'Medium Coin Pack' },
  large: { coins: 2500, price: 1999, name: 'Large Coin Pack' },
  mega: { coins: 6000, price: 4999, name: 'Mega Coin Pack' },
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const { coinPackage, userId } = req.body;

    if (!coinPackage || typeof coinPackage !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid parameter: coinPackage' });
    }

    const pack = packages[coinPackage];
    if (!pack) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const baseUrl = req.headers.origin || `https://${req.headers.host}`;

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.name,
              description: `${pack.coins} coins for ShatterRealms`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=true`,
      metadata: {
        coins: pack.coins.toString(),
        packageType: coinPackage,
      },
    };

    // Link payment to user if authenticated
    if (userId && typeof userId === 'string') {
      sessionConfig.client_reference_id = userId;
      sessionConfig.metadata.userId = userId;
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error.type || 'unknown', error.message);

    if (error.type === 'StripeConnectionError') {
      return res
        .status(503)
        .json({ error: 'Could not connect to payment service. Please try again.' });
    }
    if (error.type === 'StripeAuthenticationError') {
      return res.status(503).json({ error: 'Payment service misconfigured' });
    }
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid request to payment service' });
    }

    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
}
