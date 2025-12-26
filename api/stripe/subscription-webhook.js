// api/stripe/subscription-webhook.js
// Handles Stripe subscription events (checkout completed, subscription updated/canceled)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Disable body parsing - we need raw body for webhook signature verification
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[SubWebhook] Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  let buf;

  try {
    buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`[SubWebhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[SubWebhook] Received event: ${event.type}`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[SubWebhook] Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    switch (event.type) {
      // User completed checkout and paid
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`[SubWebhook] Checkout completed for user: ${userId}`);

        if (!userId) {
          console.error('[SubWebhook] No userId in session metadata');
          break;
        }

        // Update user profile to active subscription
        const updateData = {
          subscription_status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_updated_at: new Date().toISOString(),
        };

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SubWebhook] Failed to update user: ${response.status} - ${errorText}`);
        } else {
          console.log(`[SubWebhook] ✅ User ${userId} upgraded to active subscription`);
        }
        break;
      }

      // Subscription renewed or updated
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const status = subscription.status;

        console.log(`[SubWebhook] Subscription updated: ${subscription.id}, status: ${status}`);

        if (!userId) {
          console.log('[SubWebhook] No userId in subscription metadata, skipping');
          break;
        }

        // Map Stripe status to our status
        let subscriptionStatus = 'trialing';
        if (status === 'active') {
          subscriptionStatus = 'active';
        } else if (status === 'past_due' || status === 'unpaid') {
          subscriptionStatus = 'past_due';
        } else if (status === 'canceled') {
          subscriptionStatus = 'canceled';
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              subscription_status: subscriptionStatus,
              subscription_updated_at: new Date().toISOString(),
            }),
          }
        );

        if (response.ok) {
          console.log(`[SubWebhook] Updated user ${userId} status to: ${subscriptionStatus}`);
        }
        break;
      }

      // Subscription canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        console.log(`[SubWebhook] Subscription deleted: ${subscription.id}`);

        if (!userId) {
          console.log('[SubWebhook] No userId in subscription metadata, skipping');
          break;
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              subscription_status: 'canceled',
              subscription_updated_at: new Date().toISOString(),
            }),
          }
        );

        if (response.ok) {
          console.log(`[SubWebhook] User ${userId} subscription canceled`);
        }
        break;
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log(`[SubWebhook] Payment failed for subscription: ${subscriptionId}`);
        // You could send an email notification here
        break;
      }

      default:
        console.log(`[SubWebhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[SubWebhook] Error processing event: ${error.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
