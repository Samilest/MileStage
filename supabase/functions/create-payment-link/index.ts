import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { stageId, shareCode } = await req.json();

    if (!stageId || !shareCode) {
      throw new Error('stageId and shareCode are required');
    }

    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select(`
        id,
        stage_number,
        name,
        amount,
        project_id,
        projects!inner (
          id,
          project_name,
          share_code,
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
      throw new Error('Stage not found');
    }

    if (stage.projects.share_code !== shareCode) {
      throw new Error('Invalid share code');
    }

    const stripeAccountId = stage.projects.user_profiles.stripe_account_id;
    const chargesEnabled = stage.projects.user_profiles.stripe_charges_enabled;

    if (!stripeAccountId || !chargesEnabled) {
      return new Response(
        JSON.stringify({ 
          error: 'Payment setup required',
          setupRequired: true 
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const successUrl = `${origin}/client/${shareCode}?payment_success=true&stage_id=${stageId}`;
    const cancelUrl = `${origin}/client/${shareCode}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${stage.projects.project_name} - ${stage.name}`,
                description: `Stage ${stage.stage_number} payment`,
              },
              unit_amount: Math.round(stage.amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          stage_id: stageId,
          project_id: stage.project_id,
          share_code: shareCode,
        },
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});