const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const getRawBody = require('raw-body');

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Get raw body using raw-body package
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('[Webhook] Event constructed successfully:', event.type);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
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
        console.log(`[Webhook] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error handling webhook:', error);
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

    console.log(`[Webhook] Updated Stripe status for user ${profile.id}`);
  } catch (error) {
    console.error('[Webhook] Error handling account update:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    console.log('[Webhook] Payment succeeded:', paymentIntent.id);
    const { stage_id } = paymentIntent.metadata;

    if (!stage_id) {
      console.error('[Webhook] No stage_id in payment intent metadata');
      return;
    }

    console.log('[Webhook] Updating stage:', stage_id);

    // Update stage payment status
    const { data: updatedStage, error: stageError } = await supabaseAdmin
      .from('stages')
      .update({
        payment_status: 'received',
        payment_received_at: new Date().toISOString(),
      })
      .eq('id', stage_id)
      .select('project_id, stage_number')
      .single();

    if (stageError) {
      console.error('[Webhook] Error updating stage:', stageError);
      return;
    }

    console.log('[Webhook] Stage updated successfully:', updatedStage);

    // Get the project to find the next stage
    const { data: stages } = await supabaseAdmin
      .from('stages')
      .select('id, stage_number, status')
      .eq('project_id', updatedStage.project_id)
      .order('stage_number', { ascending: true });

    if (stages && stages.length > 0) {
      const nextStage = stages.find(s => s.stage_number === updatedStage.stage_number + 1);
      
      if (nextStage && nextStage.status === 'locked') {
        await supabaseAdmin
          .from('stages')
          .update({ status: 'active' })
          .eq('id', nextStage.id);
        
        console.log('[Webhook] Unlocked next stage:', nextStage.id);
      }
    }

    console.log(`[Webhook] Payment processing complete for stage ${stage_id}`);
  } catch (error) {
    console.error('[Webhook] Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const { stage_id } = paymentIntent.metadata;
    if (!stage_id) return;
    console.log(`[Webhook] Payment failed for stage ${stage_id}`);
  } catch (error) {
    console.error('[Webhook] Error handling payment failure:', error);
  }
}
