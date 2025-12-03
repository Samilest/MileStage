const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  try {
    const rawBody = await getRawBody(req);
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('[Webhook] Signature verified. Event type:', event.type);

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const stageId = paymentIntent.metadata?.stage_id;
      const projectId = paymentIntent.metadata?.project_id;
      const paymentType = paymentIntent.metadata?.type;

      console.log('[Webhook] Payment succeeded:', { stageId, projectId, type: paymentType });

      // Handle extension payment
      if (paymentType === 'extension' && stageId) {
        console.log('[Webhook] Processing extension payment...');
        
        // Create extension record
        const { error: extensionError } = await supabaseAdmin
          .from('extensions')
          .insert({
            stage_id: stageId,
            amount: paymentIntent.amount / 100,
            status: 'paid',
            payment_received_at: new Date().toISOString(),
            additional_revisions: 1,
            stripe_payment_intent_id: paymentIntent.id,
          });

        if (extensionError) {
          console.error('[Webhook] Extension insert failed:', extensionError);
          return res.status(500).json({ error: 'Failed to create extension record' });
        }

        console.log('[Webhook] Extension payment recorded');

        // Get stage and project info for notification
        const { data: stage } = await supabaseAdmin
          .from('stages')
          .select('name, stage_number, projects(id, user_id, project_name, client_name)')
          .eq('id', stageId)
          .single();

        if (stage && stage.projects) {
          // Create notification for freelancer
          await supabaseAdmin
            .from('notifications')
            .insert({
              project_id: stage.projects.id,
              stage_id: stageId,
              type: 'extension_purchased',
              message: `${stage.projects.client_name} purchased an extra revision for ${stage.name}`,
              is_read: false,
            });

          console.log('[Webhook] Notification created for extension purchase');
        }

        return res.status(200).json({ received: true });
      }

      // Handle stage payment
      if (stageId && projectId && !paymentType) {
        // Update stage to completed
        const { data: updatedStage, error: updateError } = await supabaseAdmin
          .from('stages')
          .update({
            payment_status: 'received',
            payment_received_at: new Date().toISOString(),
            status: 'completed'
          })
          .eq('id', stageId)
          .select('stage_number, name, projects(project_name, client_name)')
          .single();

        if (updateError) {
          console.error('[Webhook] Update failed:', updateError);
          return res.status(500).json({ error: 'Failed to update stage' });
        }

        console.log('[Webhook] Stage updated to completed');

        // Create notification for stage payment
        if (updatedStage && updatedStage.projects) {
          await supabaseAdmin
            .from('notifications')
            .insert({
              project_id: projectId,
              stage_id: stageId,
              type: 'payment_received',
              message: `${updatedStage.projects.client_name} paid for ${updatedStage.name}`,
              is_read: false,
            });

          console.log('[Webhook] Notification created for stage payment');
        }

        // Get all stages to unlock next one
        const { data: stages } = await supabaseAdmin
          .from('stages')
          .select('id, stage_number, status')
          .eq('project_id', projectId)
          .order('stage_number', { ascending: true });

        if (stages) {
          const nextStage = stages.find(s => 
            s.stage_number === updatedStage.stage_number + 1
          );

          if (nextStage && nextStage.status === 'locked') {
            await supabaseAdmin
              .from('stages')
              .update({ status: 'active' })
              .eq('id', nextStage.id);
            
            console.log('[Webhook] Unlocked next stage');
          }
        }
      }
    }

    // Handle account.updated
    if (event.type === 'account.updated') {
      const account = event.data.object;
      const userId = account.metadata?.user_id;

      if (userId) {
        await supabaseAdmin
          .from('user_profiles')
          .update({
            stripe_charges_enabled: account.charges_enabled || false,
            stripe_payouts_enabled: account.payouts_enabled || false,
            stripe_onboarding_completed: account.details_submitted || false,
            stripe_connected_at: account.details_submitted ? new Date().toISOString() : null
          })
          .eq('id', userId);
        
        console.log('[Webhook] Updated user profile');
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
};
