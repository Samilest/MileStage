// api/stripe/subscription-webhook.js
// Fixed webhook - uses correct column names

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          const customerId = session.customer;
          const subscriptionId = session.subscription;
          const customerEmail = session.customer_details?.email || session.customer_email;

          console.log(`[Webhook] Checkout completed - Customer: ${customerId}, Email: ${customerEmail}, Subscription: ${subscriptionId}`);

          if (!customerEmail) {
            console.error('[Webhook] No customer email found in session');
            break;
          }

          // Update user_profiles - find by EMAIL since stripe_customer_id might be NULL
          const supabaseUrl = process.env.VITE_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          const response = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?email=eq.${encodeURIComponent(customerEmail)}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                subscription_status: 'active',
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                trial_ends_at: null,
              }),
            }
          );

          if (!response.ok) {
            console.error(`[Webhook] Failed to update user: ${response.statusText}`);
          } else {
            console.log(`[Webhook] User updated to active status for email: ${customerEmail}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        console.log(`[Webhook] Subscription updated - Customer: ${customerId}, Status: ${status}`);

        // Map Stripe status to our status
        let ourStatus = 'trialing';
        if (status === 'active') ourStatus = 'active';
        else if (status === 'past_due') ourStatus = 'past_due';
        else if (status === 'canceled') ourStatus = 'canceled';
        else if (status === 'unpaid') ourStatus = 'past_due';
        else if (status === 'trialing') ourStatus = 'trialing';

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?stripe_customer_id=eq.${customerId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              subscription_status: ourStatus,
              stripe_subscription_id: subscription.id,
            }),
          }
        );

        if (!response.ok) {
          console.error(`[Webhook] Failed to update user: ${response.statusText}`);
        } else {
          console.log(`[Webhook] User subscription status updated to: ${ourStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        console.log(`[Webhook] Subscription deleted - Customer: ${customerId}`);

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?stripe_customer_id=eq.${customerId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            }),
          }
        );

        if (!response.ok) {
          console.error(`[Webhook] Failed to update user: ${response.statusText}`);
        } else {
          console.log(`[Webhook] User subscription canceled`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing event:`, error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
