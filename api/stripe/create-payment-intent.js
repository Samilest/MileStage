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

  const { stageId, shareCode } = req.body;

  if (!stageId || !shareCode) {
    return res.status(400).json({ error: 'Stage ID and share code required' });
  }

  try {
    // Fetch stage and project details
    const { data: stage, error: stageError } = await supabaseAdmin
      .from('stages')
      .select(`
        id,
        stage_number,
        name,
        amount,
        projects!inner (
          id,
          project_name,
          share_code,
          currency,
          user_id,
          user_profiles!inner (
            stripe_account_id,
            stripe_charges_enabled
          )
        )
      `)
      .eq('id', stageId)
      .single();

    if (stageError || !stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Verify share code
    if (stage.projects.share_code !== shareCode) {
      return res.status(403).json({ error: 'Invalid share code' });
    }

    const freelancerStripeAccount = stage.projects.user_profiles.stripe_account_id;
    const chargesEnabled = stage.projects.user_profiles.stripe_charges_enabled;

    if (!freelancerStripeAccount || !chargesEnabled) {
      return res.status(400).json({ 
        error: 'Payment processing not set up',
        message: 'The freelancer needs to complete Stripe setup first'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(stage.amount * 100), // Convert to cents
      currency: stage.projects.currency.toLowerCase(),
      application_fee_amount: 0, // MileStage takes 0% fee
      transfer_data: {
        destination: freelancerStripeAccount,
      },
      metadata: {
        stage_id: stage.id,
        project_id: stage.projects.id,
        stage_number: stage.stage_number,
        project_name: stage.projects.project_name,
        share_code: shareCode,  // CRITICAL: Add share_code for return URL
      },
      description: `${stage.projects.project_name} - Stage ${stage.stage_number}: ${stage.name}`,
    });

    // Create or update stage_payment record
    const { error: paymentError } = await supabaseAdmin
      .from('stage_payments')
      .upsert({
        stage_id: stage.id,
        amount: stage.amount,
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      error: 'Failed to create payment',
      details: error.message,
    });
  }
};
