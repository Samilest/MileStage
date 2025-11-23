const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, stageId } = req.body;

  if (!paymentIntentId || !stageId) {
    return res.status(400).json({ error: 'Missing paymentIntentId or stageId' });
  }

  try {
    console.log('[Confirm Payment] Verifying payment:', paymentIntentId);

    // 1. Verify payment actually succeeded with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      console.log('[Confirm Payment] Payment not succeeded:', paymentIntent.status);
      return res.status(400).json({ 
        error: 'Payment not completed',
        status: paymentIntent.status 
      });
    }

    console.log('[Confirm Payment] Payment verified! Updating stage:', stageId);

    // 2. Update stage payment status
    const { data: updatedStage, error: stageError } = await supabaseAdmin
      .from('stages')
      .update({
        payment_status: 'received',
        payment_received_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .select('project_id, stage_number')
      .single();

    if (stageError) {
      console.error('[Confirm Payment] Error updating stage:', stageError);
      return res.status(500).json({ error: 'Failed to update stage' });
    }

    console.log('[Confirm Payment] Stage updated successfully!');

    // 3. Unlock next stage
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
        
        console.log('[Confirm Payment] Unlocked next stage:', nextStage.id);
      }
    }

    console.log('[Confirm Payment] ✅ Payment processing complete!');

    return res.status(200).json({ 
      success: true,
      message: 'Payment confirmed and stage updated' 
    });

  } catch (error) {
    console.error('[Confirm Payment] Error:', error);
    return res.status(500).json({ 
      error: 'Payment confirmation failed',
      details: error.message 
    });
  }
};
