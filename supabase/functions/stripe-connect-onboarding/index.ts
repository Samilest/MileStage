import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@14.11.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  console.log('=== STRIPE CONNECT ONBOARDING FUNCTION START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Step 1: Checking environment variables...');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      stripeKeyLength: stripeSecretKey?.length || 0,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not configured!');
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    console.log('Step 2: Initializing Stripe client...');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    console.log('Stripe client initialized successfully');

    console.log('Step 3: Initializing Supabase client...');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    console.log('Supabase client initialized');

    console.log('Step 4: Verifying authentication...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }
    console.log('Authorization header present');

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('User verification error:', userError);
      throw new Error('User verification failed: ' + userError.message);
    }

    if (!user) {
      console.error('No user found for token');
      throw new Error('Unauthorized - no user found');
    }

    console.log('Step 5: User authenticated successfully');
    console.log('User ID:', user.id);
    console.log('User email:', user.email);

    console.log('Step 6: Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_account_id, email, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile: ' + profileError.message);
    }

    console.log('Profile fetched:', {
      hasStripeAccount: !!profile?.stripe_account_id,
      email: profile?.email,
      name: profile?.name,
    });

    let accountId = profile?.stripe_account_id;

    // Create a new Stripe Connect Express account if one doesn't exist
    if (!accountId) {
      console.log('Step 7a: Creating new Stripe Express account...');
      console.log('Account details:', {
        email: profile?.email || user.email,
        userId: user.id,
      });

      const account = await stripe.accounts.create({
        type: 'express',
        email: profile?.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: user.id,
        },
      });

      accountId = account.id;
      console.log('Created Stripe account successfully:', accountId);

      console.log('Saving account ID to database...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to save account ID:', updateError);
        throw new Error('Failed to save Stripe account ID: ' + updateError.message);
      }
      console.log('Account ID saved to database');
    } else {
      console.log('Step 7b: Using existing Stripe account:', accountId);
    }

    // Get the origin from the request
    console.log('Step 8: Determining redirect URLs...');
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    console.log('Origin:', origin);

    const refreshUrl = `${origin}/dashboard?stripe=refresh`;
    const returnUrl = `${origin}/dashboard?stripe=success`;
    console.log('Redirect URLs:', {
      refresh: refreshUrl,
      return: returnUrl,
    });

    // Create an account link for onboarding
    console.log('Step 9: Creating Stripe account link...');
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    console.log('Account link created successfully!');
    console.log('Onboarding URL:', accountLink.url);
    console.log('=== FUNCTION SUCCESS - RETURNING URL ===');

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== STRIPE CONNECT ONBOARDING FUNCTION END (ERROR) ===');

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