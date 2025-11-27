const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to read request body as buffer
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Read the raw body as buffer
    const buf = await buffer(req);
    
    // Construct event with raw buffer
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    
    console.log('[Webhook] ✅ Event verified:', event.type);
  } catch (err) {
    console.error('[Webhook] ❌ Signature verification failed:', err.message);
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
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error handling event:', error);
    return res.status(500).json({ error: 'Webhook handler failed', message: error.message });
  }
};

async function handleAccountUpdated(account) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('stripe_account_id', account.id)
      .maybeSingle();

    if (!profile) {
      console.log('[Webhook] No profile found for account:', account.id);
      return;
    }

    await supabaseAdmin
      .from('user_profiles')
      .update({
        stripe_onboarding_completed: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_account_currency: account.default_currency || null,
      })
      .eq('id', profile.id);

    console.log('[Webhook] ✅ Updated Stripe status for user:', profile.id);
  } catch (error) {
    console.error('[Webhook] ❌ Error handling account update:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    console.log('[Webhook] 💰 Payment succeeded:', paymentIntent.id);
    
    const { stage_id } = paymentIntent.metadata;

    if (!stage_id) {
      console.error('[Webhook] ❌ No stage_id in metadata!');
      console.log('[Webhook] Metadata:', paymentIntent.metadata);
      return;
    }

    console.log('[Webhook] 📝 Updating stage:', stage_id);

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
      console.error('[Webhook] ❌ Error updating stage:', stageError);
      return;
    }

    console.log('[Webhook] ✅ Stage updated:', updatedStage);

    // Unlock next stage
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
        
        console.log('[Webhook] 🔓 Unlocked next stage:', nextStage.id);
      }
    }

    console.log('[Webhook] ✅ Payment processing complete!');
  } catch (error) {
    console.error('[Webhook] ❌ Error handling payment:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const { stage_id } = paymentIntent.metadata;
    if (stage_id) {
      console.log(`[Webhook] ❌ Payment failed for stage:`, stage_id);
    }
  } catch (error) {
    console.error('[Webhook] Error handling payment failure:', error);
  }
}

// IMPORTANT: Use 'export' syntax for Next.js config
export { handler as default };

export const config = {
  api: {
    bodyParser: false,
  },
};
