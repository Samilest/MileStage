// api/stripe/create-extension-payment.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stageId, amount } = req.body;

    if (!stageId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get stage and project details from Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const stageResponse = await fetch(
      `${supabaseUrl}/rest/v1/stages?id=eq.${stageId}&select=*,projects(*)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!stageResponse.ok) {
      throw new Error('Failed to fetch stage details');
    }

    const stages = await stageResponse.json();
    const stage = stages[0];

    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    const project = stage.projects;

    // Get freelancer's Stripe account
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${project.user_id}&select=stripe_account_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch freelancer details');
    }

    const users = await userResponse.json();
    const freelancer = users[0];

    if (!freelancer?.stripe_account_id) {
      return res.status(400).json({ error: 'Freelancer has not connected Stripe' });
    }

    // Create Stripe payment link for extension
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: project.currency?.toLowerCase() || 'usd',
          product_data: {
            name: `Extra Revision - ${project.project_name}`,
            description: `Additional revision for ${stage.name}`,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      application_fee_amount: 0, // Zero fees
      on_behalf_of: freelancer.stripe_account_id,
      transfer_data: {
        destination: freelancer.stripe_account_id,
      },
      metadata: {
        type: 'extension',
        stage_id: stageId,
        project_id: project.id,
        amount: amount.toString(),
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.VITE_APP_URL}/client/${project.share_code}?payment=success`,
        },
      },
    });

    return res.status(200).json({
      paymentUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });

  } catch (error) {
    console.error('Error creating extension payment:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create payment link',
    });
  }
}
