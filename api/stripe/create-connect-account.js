const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Check if user already has a Stripe account
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_account_id, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    let accountId = profile.stripe_account_id;

    // Create new Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      accountId = account.id;

      // Save Stripe account ID to database
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          stripe_account_id: accountId,
          stripe_connected_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return res.status(500).json({ error: 'Failed to save Stripe account' });
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.VITE_APP_URL}/dashboard?stripe_return=true&refresh=true`,
      return_url: `${process.env.VITE_APP_URL}/dashboard?stripe_return=true`,
      type: 'account_onboarding',
    });

    return res.status(200).json({ 
      accountLink: accountLink.url,
      accountId 
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return res.status(500).json({ 
      error: 'Failed to create Stripe account',
      details: error.message 
    });
  }
};
