// api/stripe/create-checkout-session.js
// Creates a Stripe Checkout session for subscription payments

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, plan, email } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ error: 'User ID and plan are required' });
  }

  try {
    console.log('[Checkout] Creating session for user:', userId, 'plan:', plan);

    // Define price IDs - YOU MUST CREATE THESE IN STRIPE DASHBOARD
    // Go to Stripe Dashboard → Products → Create Product → Add Prices
    // Then copy the price IDs here
    const priceIds = {
      monthly: process.env.STRIPE_PRICE_MONTHLY, // e.g., price_1ABC123...
      annual: process.env.STRIPE_PRICE_ANNUAL,   // e.g., price_1DEF456...
    };

    const priceId = priceIds[plan];

    if (!priceId) {
      console.error('[Checkout] Invalid plan or missing price ID:', plan);
      return res.status(400).json({ 
        error: 'Invalid plan selected',
        hint: 'Make sure STRIPE_PRICE_MONTHLY and STRIPE_PRICE_ANNUAL are set in environment variables'
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      success_url: `${process.env.VITE_APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.VITE_APP_URL}/upgrade?canceled=true`,
      allow_promotion_codes: true,
    });

    console.log('[Checkout] Session created:', session.id);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[Checkout] Error creating session:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
};
