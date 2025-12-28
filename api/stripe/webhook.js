// api/stripe/webhook.js - Stripe Connect webhook handler
// Handles project payment webhooks and Connect account updates

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook] Missing STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  let buf;

  try {
    // Read raw body
    if (req.body instanceof Buffer) {
      buf = req.body;
    } else if (typeof req.body === 'string') {
      buf = Buffer.from(req.body);
    } else {
      buf = Buffer.from(JSON.stringify(req.body));
    }

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Webhook] Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    switch (event.type) {
      // ============================================
      // STRIPE CONNECT ACCOUNT UPDATES
      // ============================================
      case 'account.updated': {
        const account = event.data.object;
        const accountId = account.id;

        console.log(`[Webhook] Account updated: ${accountId}`);
        console.log(`[Webhook] Charges enabled: ${account.charges_enabled}`);
        console.log(`[Webhook] Payouts enabled: ${account.payouts_enabled}`);
        console.log(`[Webhook] Details submitted: ${account.details_submitted}`);

        // Update user profile with account capabilities
        const updateData = {
          stripe_charges_enabled: account.charges_enabled || false,
          stripe_payouts_enabled: account.payouts_enabled || false,
          stripe_onboarding_completed: account.details_submitted || false,
        };

        // If account is fully enabled, set connected timestamp
        if (account.charges_enabled && account.payouts_enabled) {
          updateData.stripe_connected_at = new Date().toISOString();
        }

        console.log(`[Webhook] Updating account ${accountId} with:`, updateData);

        const accountResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?stripe_account_id=eq.${accountId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!accountResponse.ok) {
          const errorText = await accountResponse.text();
          console.error(`[Webhook] Failed to update user profile: ${accountResponse.status} - ${errorText}`);
        } else {
          const updated = await accountResponse.json();
          console.log(`[Webhook] Successfully updated ${updated.length} user(s) for account ${accountId}`);
          
          if (account.charges_enabled && account.payouts_enabled) {
            console.log(`[Webhook] ✅ Account ${accountId} is now fully enabled!`);
          }
        }
        break;
      }

      // ============================================
      // PROJECT PAYMENT EVENTS
      // ============================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const stageId = paymentIntent.metadata?.stage_id;

        if (!stageId) {
          console.log('[Webhook] No stage_id in payment metadata, skipping');
          break;
        }

        console.log(`[Webhook] Payment succeeded for stage: ${stageId}`);

        // Update stage payment status (EXISTING LOGIC - DO NOT CHANGE)
        const paymentResponse = await fetch(
          `${supabaseUrl}/rest/v1/stage_payments?id=eq.${stageId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              status: 'paid',
              marked_paid_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntent.id,
            }),
          }
        );

        if (!paymentResponse.ok) {
          console.error(`[Webhook] Failed to update stage payment: ${paymentResponse.statusText}`);
        } else {
          console.log(`[Webhook] Stage ${stageId} marked as paid`);
          
          // ============================================
          // NEW: SEND EMAIL NOTIFICATIONS
          // ============================================
          // This section is NEW and does NOT affect existing payment logic
          // If emails fail, payment processing still succeeds
          try {
            await sendPaymentEmails(stageId, supabaseUrl, supabaseKey);
          } catch (emailError) {
            // Log error but don't fail the webhook
            console.error('[Webhook] Email sending failed (non-critical):', emailError.message);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const stageId = paymentIntent.metadata?.stage_id;

        if (stageId) {
          console.log(`[Webhook] Payment failed for stage: ${stageId}`);
          // Optionally update status or notify user
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing event: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ============================================
// EMAIL NOTIFICATION HELPER (NEW FUNCTION)
// ============================================
async function sendPaymentEmails(stageId, supabaseUrl, supabaseKey) {
  console.log(`[Webhook] Fetching stage details for email notifications: ${stageId}`);
  
  // Fetch stage, project, and user details
  const stageResponse = await fetch(
    `${supabaseUrl}/rest/v1/stage_payments?id=eq.${stageId}&select=*,stages!inner(*,projects!inner(id,project_name,client_name,client_email,user_id,user_profiles!inner(email,full_name)))`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );
  
  if (!stageResponse.ok) {
    throw new Error(`Failed to fetch stage details: ${stageResponse.statusText}`);
  }
  
  const stageData = await stageResponse.json();
  
  if (!stageData || stageData.length === 0) {
    console.log('[Webhook] No stage data found for email');
    return;
  }
  
  const payment = stageData[0];
  const stage = payment.stages;
  const project = stage.projects;
  const freelancer = project.user_profiles;
  
  console.log('[Webhook] Sending payment notification emails...');
  
  // Call the email API endpoint
  const emailApiUrl = process.env.VITE_APP_URL || 'https://milestage.com';
  
  // Send payment received email to freelancer
  try {
    const freelancerEmailResponse = await fetch(`${emailApiUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_received',
        data: {
          freelancerEmail: freelancer.email,
          freelancerName: freelancer.full_name || 'there',
          projectName: project.project_name,
          stageName: stage.name || `Stage ${stage.stage_number}`,
          amount: (payment.amount / 100).toFixed(2),
          currency: payment.currency || 'USD',
        },
      }),
    });
    
    if (freelancerEmailResponse.ok) {
      console.log('[Webhook] ✅ Payment received email sent to freelancer');
    } else {
      console.error('[Webhook] Failed to send freelancer email:', await freelancerEmailResponse.text());
    }
  } catch (error) {
    console.error('[Webhook] Error sending freelancer email:', error.message);
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
          stageName: stage.name || `Stage ${stage.stage_number}`,
          amount: (payment.amount / 100).toFixed(2),
          currency: payment.currency || 'USD',
        },
      }),
    });
    
    if (clientEmailResponse.ok) {
      console.log('[Webhook] ✅ Payment confirmation email sent to client');
    } else {
      console.error('[Webhook] Failed to send client email:', await clientEmailResponse.text());
    }
  } catch (error) {
    console.error('[Webhook] Error sending client email:', error.message);
  }
}

// Disable body parsing for webhooks (need raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};
