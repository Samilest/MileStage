import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get the signature
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No stripe-signature header found');
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Read body as text - CRITICAL: must be raw, unmodified body
    const body = await req.text();
    
    console.log('Webhook received:', {
      signature: signature.substring(0, 20) + '...',
      bodyLength: body.length,
      webhookSecretSet: !!webhookSecret
    });

    // Initialize Stripe - DON'T specify apiVersion to use default
    const stripe = new Stripe(stripeSecretKey, {
      // No apiVersion - let it use whatever Stripe sent
    });

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('✅ Signature verified successfully for event:', event.type);
    } catch (err) {
      console.error('❌ Signature verification failed:', {
        error: err.message,
        name: err.name,
        signature: signature.substring(0, 30),
      });
      return new Response(
        JSON.stringify({ 
          error: 'Webhook signature verification failed',
          details: err.message 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('Processing event:', event.type);

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const stageId = paymentIntent.metadata?.stage_id;
      const projectId = paymentIntent.metadata?.project_id;

      console.log('Payment succeeded:', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        stageId,
        projectId
      });

      if (stageId && projectId) {
        const { error } = await supabase
          .from('stages')
          .update({
            payment_status: 'received',
            payment_received_at: new Date().toISOString(),
          })
          .eq('id', stageId);

        if (error) {
          console.error('Error updating stage:', error);
          throw error;
        }

        console.log('✅ Stage marked as paid:', stageId);

        // Check and unlock next stage
        const { data: stages } = await supabase
          .from('stages')
          .select('id, stage_number, status')
          .eq('project_id', projectId)
          .order('stage_number', { ascending: true });

        if (stages) {
          const currentStageData = stages.find((s: any) => s.id === stageId);
          const nextStage = stages.find((s: any) => 
            s.stage_number === (currentStageData?.stage_number || 0) + 1
          );
          
          if (nextStage && nextStage.status === 'locked') {
            await supabase
              .from('stages')
              .update({ status: 'active' })
              .eq('id', nextStage.id);
            
            console.log('✅ Unlocked next stage:', nextStage.id);
          }
        }
      }
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const stageId = session.metadata?.stage_id;
      const projectId = session.metadata?.project_id;

      console.log('Checkout completed:', { stageId, projectId });

      if (stageId && projectId) {
        const { error } = await supabase
          .from('stages')
          .update({
            payment_status: 'received',
            payment_received_at: new Date().toISOString(),
          })
          .eq('id', stageId);

        if (error) {
          console.error('Error updating stage:', error);
          throw error;
        }

        console.log('✅ Stage marked as paid:', stageId);
      }
    }

    // Handle account.updated
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      const userId = account.metadata?.user_id;

      if (userId) {
        await supabase
          .from('user_profiles')
          .update({
            stripe_charges_enabled: account.charges_enabled || false,
            stripe_payouts_enabled: account.payouts_enabled || false,
            stripe_onboarding_completed: account.details_submitted || false,
            stripe_connected_at: account.details_submitted ? new Date().toISOString() : null,
          })
          .eq('id', userId);

        console.log('✅ Updated user Stripe status:', userId);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
