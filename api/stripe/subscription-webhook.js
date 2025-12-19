// api/stripe/subscription-webhook.js
// Handles Stripe subscription events

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ 
      error: 'Webhook handler failed',
      message: error.message 
    });
  }
}

// Handle successful checkout
async function handleCheckoutComplete(session) {
  const userId = session.metadata.userId || session.client_reference_id;
  
  if (!userId) {
    console.error('No userId found in checkout session');
    return;
  }

  // Update user profile with Stripe customer ID
  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: session.customer,
      subscription_status: 'active',
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user after checkout:', error);
  } else {
    console.log(`User ${userId} subscription activated`);
  }
}

// Handle subscription updates (renewals, plan changes)
async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  const status = subscription.status; // active, past_due, canceled, etc.
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log(`Subscription updated for user ${userId}: ${status}`);
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error canceling subscription:', error);
  } else {
    console.log(`Subscription canceled for user ${userId}`);
  }
}

// Handle successful payment (renewal)
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  
  // Find user by customer ID
  const { data: user } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
      })
      .eq('id', user.id);

    if (!error) {
      console.log(`Payment succeeded for user ${user.id}`);
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  // Find user by customer ID
  const { data: user } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', user.id);

    if (!error) {
      console.log(`Payment failed for user ${user.id}`);
    }
  }
}
