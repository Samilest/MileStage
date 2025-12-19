// api/create-portal-session.js
// Creates a Stripe Customer Portal session for subscription management

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get user's Stripe customer ID
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !user?.stripe_customer_id) {
      return res.status(404).json({ 
        error: 'No subscription found. Please upgrade first.' 
      });
    }

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.VITE_APP_URL}/settings`,
    });

    return res.status(200).json({ 
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ 
      error: 'Failed to create portal session',
      message: error.message 
    });
  }
}
