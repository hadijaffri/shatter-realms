// Vercel Serverless Function to provide Stripe public key
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  // Enable CORS
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  return res.status(200).json({
    publishableKey: key,
    adsensePublisherId: process.env.GOOGLE_ADSENSE_PUB_ID || null,
    adsenseAdSlot: process.env.GOOGLE_ADSENSE_AD_SLOT || null,
  });
}
