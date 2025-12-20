// api/stripe/verify-connect-status.js
// Verifies Stripe Connect account status directly from Stripe API
// and updates the database - no webhook needed

const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    console.log('[Verify Connect] Checking status for user:', userId);

    // 1. Get user's Stripe account ID from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Verify Connect] Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!profile?.stripe_account_id) {
      console.log('[Verify Connect] No Stripe account found for user');
      return res.status(200).json({
        connected: false,
        onboardingCompleted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    // 2. Fetch account status directly from Stripe
    console.log('[Verify Connect] Fetching Stripe account:', profile.stripe_account_id);
    
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    console.log('[Verify Connect] Stripe account status:', {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

    // 3. Update database with fresh status from Stripe
    const updateData = {
      stripe_charges_enabled: account.charges_enabled || false,
      stripe_payouts_enabled: account.payouts_enabled || false,
      stripe_onboarding_completed: account.details_submitted || false,
    };

    // If fully enabled, set connected timestamp
    if (account.charges_enabled && account.payouts_enabled) {
      updateData.stripe_connected_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('[Verify Connect] Error updating profile:', updateError);
      // Don't fail - still return the status
    } else {
      console.log('[Verify Connect] Database updated successfully');
    }

    // 4. Return the status
    return res.status(200).json({
      connected: true,
      onboardingCompleted: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      accountId: profile.stripe_account_id,
    });

  } catch (error) {
    console.error('[Verify Connect] Error:', error);
    return res.status(500).json({
      error: 'Failed to verify Stripe status',
      details: error.message,
    });
  }
};
