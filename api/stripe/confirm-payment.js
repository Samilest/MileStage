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

    // 2. First fetch stage details for email (before updating)
    const { data: stageDetails, error: fetchError } = await supabaseAdmin
      .from('stages')
      .select(`
        id,
        name,
        stage_number,
        amount,
        project_id,
        projects!inner (
          id,
          project_name,
          client_name,
          client_email,
          share_code,
          currency,
          user_id,
          user_profiles!inner (
            id,
            email,
            name
          )
        )
      `)
      .eq('id', stageId)
      .single();

    if (fetchError) {
      console.error('[Confirm Payment] Error fetching stage details:', fetchError);
    }

    // 3. Update stage payment status AND mark as completed
    const { data: updatedStage, error: stageError } = await supabaseAdmin
      .from('stages')
      .update({
        payment_status: 'received',
        payment_received_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', stageId)
      .select('project_id, stage_number')
      .single();

    if (stageError) {
      console.error('[Confirm Payment] Error updating stage:', stageError);
      return res.status(500).json({ error: 'Failed to update stage' });
    }

    console.log('[Confirm Payment] Stage updated successfully!');

    // 4. Unlock next stage
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

    // 5. Send email notifications (non-blocking - errors won't break payment flow)
    if (stageDetails && stageDetails.projects) {
      const project = stageDetails.projects;
      const freelancer = project.user_profiles;
      const emailApiUrl = process.env.VITE_APP_URL || 'https://milestage.com';

      console.log('[Confirm Payment] Sending email notifications...');
      console.log('[Confirm Payment] Freelancer:', freelancer?.email);
      console.log('[Confirm Payment] Client:', project.client_email);

      // Send payment received email to freelancer
      try {
        const freelancerEmailResponse = await fetch(`${emailApiUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_received',
            data: {
              freelancerEmail: freelancer.email,
              freelancerName: freelancer.name || 'there',
              projectName: project.project_name,
              stageName: stageDetails.name || `Stage ${stageDetails.stage_number}`,
              stageNumber: stageDetails.stage_number,
              amount: stageDetails.amount,
              currency: project.currency || 'USD',
              clientName: project.client_name,
              projectId: project.id,
            },
          }),
        });

        if (freelancerEmailResponse.ok) {
          console.log('[Confirm Payment] ✅ Payment received email sent to freelancer');
        } else {
          const errorText = await freelancerEmailResponse.text();
          console.error('[Confirm Payment] Failed to send freelancer email:', errorText);
        }
      } catch (emailError) {
        console.error('[Confirm Payment] Error sending freelancer email:', emailError.message);
      }

      // Send payment confirmation email to client
      try {
        const clientEmailResponse = await fetch(`${emailApiUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_confirmation',
            data: {
              clientEmail: project.client_email,
              clientName: project.client_name,
              projectName: project.project_name,
              stageName: stageDetails.name || `Stage ${stageDetails.stage_number}`,
              stageNumber: stageDetails.stage_number,
              amount: stageDetails.amount,
              currency: project.currency || 'USD',
              freelancerName: freelancer.name || 'Your freelancer',
              portalUrl: `https://milestage.com/client/${project.share_code}`,
            },
          }),
        });

        if (clientEmailResponse.ok) {
          console.log('[Confirm Payment] ✅ Payment confirmation email sent to client');
        } else {
          const errorText = await clientEmailResponse.text();
          console.error('[Confirm Payment] Failed to send client email:', errorText);
        }
      } catch (emailError) {
        console.error('[Confirm Payment] Error sending client email:', emailError.message);
      }
    } else {
      console.log('[Confirm Payment] Skipping emails - could not fetch stage/project details');
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
