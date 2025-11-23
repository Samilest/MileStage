const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { buffer } = require('micro');

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

async function handleAccountUpdated(account) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('stripe_account_id', account.id)
      .single();

    if (!profile) return;

    await supabaseAdmin
      .from('user_profiles')
      .update({
        stripe_onboarding_completed: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_account_currency: account.default_currency || null,
      })
      .eq('id', profile.id);

    console.log(`Updated Stripe status for user ${profile.id}, currency: ${account.default_currency}`);
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    const { stage_id } = paymentIntent.metadata;

    if (!stage_id) {
      console.error('No stage_id in payment intent metadata');
      return;
    }

    // Update stage payment status
    await supabaseAdmin
      .from('stage_payments')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Update stage status
    await supabaseAdmin
      .from('stages')
      .update({
        payment_status: 'paid',
        payment_received_at: new Date().toISOString(),
      })
      .eq('id', stage_id);

    console.log(`Payment succeeded for stage ${stage_id}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const { stage_id } = paymentIntent.metadata;

    if (!stage_id) return;

    console.log(`Payment failed for stage ${stage_id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Disable body parsing for webhook verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
