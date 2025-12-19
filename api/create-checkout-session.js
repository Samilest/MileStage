// api/create-checkout-session.js
// Creates a Stripe Checkout session for subscription payment

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, priceId } = req.body;

    if (!userId || !userEmail || !priceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // price_xxxxx from Stripe Dashboard
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId, // Link to your user
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      success_url: `${process.env.VITE_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${process.env.VITE_APP_URL}/pricing?canceled=true`,
      allow_promotion_codes: true, // Allow discount codes
    });

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}
