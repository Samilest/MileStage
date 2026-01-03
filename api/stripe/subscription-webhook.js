// api/stripe/subscription-webhook.js
// Handles Stripe subscription events (checkout completed, subscription updated/canceled)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Disable body parsing - we need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[SubWebhook] Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  let buf;

  try {
    buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`[SubWebhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[SubWebhook] Received event: ${event.type}`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[SubWebhook] Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    switch (event.type) {
      // User completed checkout and paid
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`[SubWebhook] Checkout completed for user: ${userId}`);

        if (!userId) {
          console.error('[SubWebhook] No userId in session metadata');
          break;
        }

        // Update user profile to active subscription
        const updateData = {
          subscription_status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_updated_at: new Date().toISOString(),
        };

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SubWebhook] Failed to update user: ${response.status} - ${errorText}`);
        } else {
          console.log(`[SubWebhook] ✅ User ${userId} upgraded to active subscription`);
        }
        break;
      }

      // Subscription renewed or updated
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const status = subscription.status;

        console.log(`[SubWebhook] Subscription updated: ${subscription.id}, status: ${status}`);

        if (!userId) {
          console.log('[SubWebhook] No userId in subscription metadata, skipping');
          break;
        }

        // Map Stripe status to our status
        let subscriptionStatus = 'trialing';
        if (status === 'active') {
          subscriptionStatus = 'active';
        } else if (status === 'past_due' || status === 'unpaid') {
          subscriptionStatus = 'past_due';
        } else if (status === 'canceled') {
          subscriptionStatus = 'canceled';
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              subscription_status: subscriptionStatus,
              subscription_updated_at: new Date().toISOString(),
            }),
          }
        );

        if (response.ok) {
          console.log(`[SubWebhook] Updated user ${userId} status to: ${subscriptionStatus}`);
        }
        break;
      }

      // Subscription canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        console.log(`[SubWebhook] Subscription deleted: ${subscription.id}`);

        if (!userId) {
          console.log('[SubWebhook] No userId in subscription metadata, skipping');
          break;
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              subscription_status: 'canceled',
              subscription_updated_at: new Date().toISOString(),
            }),
          }
        );

        if (response.ok) {
          console.log(`[SubWebhook] User ${userId} subscription canceled`);
        }
        break;
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log(`[SubWebhook] Payment failed for subscription: ${subscriptionId}`);
        // You could send an email notification here
        break;
      }

      // ============================================
      // PROJECT PAYMENT EVENTS (Stage & Extension)
      // ============================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata || {};
        const stageId = metadata.stage_id;
        const paymentType = metadata.type; // 'extension' or undefined (stage payment)

        if (!stageId) {
          console.log('[SubWebhook] No stage_id in payment metadata, skipping');
          break;
        }

        console.log(`[SubWebhook] Payment succeeded - Type: ${paymentType || 'stage'}, Stage: ${stageId}`);

        // ============================================
        // EXTENSION PAYMENT (Extra Revision Purchase)
        // ============================================
        if (paymentType === 'extension') {
          console.log('[SubWebhook] Processing extension payment...');
          
          const extensionAmount = parseFloat(metadata.amount) || 0;
          const referenceCode = `STRIPE-${paymentIntent.id.slice(-12).toUpperCase()}`;
          
          // Insert extension record with status 'paid' (auto-verified for Stripe)
          const extensionResponse = await fetch(
            `${supabaseUrl}/rest/v1/extensions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                stage_id: stageId,
                amount: extensionAmount,
                reference_code: referenceCode,
                status: 'paid',
                marked_paid_at: new Date().toISOString(),
                verified_at: new Date().toISOString(),
                additional_revisions: 1,
                stripe_payment_intent_id: paymentIntent.id,
              }),
            }
          );

          if (!extensionResponse.ok) {
            const errorText = await extensionResponse.text();
            console.error(`[SubWebhook] Failed to create extension: ${errorText}`);
          } else {
            console.log(`[SubWebhook] ✅ Extension created for stage ${stageId}`);
            
            // Send email notification for extension purchase
            try {
              await sendExtensionEmails(stageId, extensionAmount, supabaseUrl, supabaseKey);
            } catch (emailError) {
              console.error('[SubWebhook] Extension email failed (non-critical):', emailError.message);
            }
          }
        }
        // ============================================
        // STAGE PAYMENT (Down Payment or Milestone)
        // ============================================
        else {
          console.log('[SubWebhook] Processing stage payment...');
          
          // Update stage_payments table
          const paymentResponse = await fetch(
            `${supabaseUrl}/rest/v1/stage_payments?stage_id=eq.${stageId}`,
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
            console.error(`[SubWebhook] Failed to update stage payment: ${paymentResponse.statusText}`);
          } else {
            console.log(`[SubWebhook] Stage payment ${stageId} marked as paid`);
            
            // Also update the stage's payment_status to 'received'
            const stageUpdateResponse = await fetch(
              `${supabaseUrl}/rest/v1/stages?id=eq.${stageId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  payment_status: 'received',
                  payment_received_at: new Date().toISOString(),
                }),
              }
            );

            if (!stageUpdateResponse.ok) {
              console.error(`[SubWebhook] Failed to update stage payment_status: ${stageUpdateResponse.statusText}`);
            } else {
              console.log(`[SubWebhook] Stage ${stageId} payment_status set to 'received'`);
            }
            
            // Send email notifications
            try {
              await sendPaymentEmails(stageId, supabaseUrl, supabaseKey);
            } catch (emailError) {
              console.error('[SubWebhook] Email sending failed (non-critical):', emailError.message);
            }
            
            // Check if project is completed (all stages paid)
            try {
              await checkProjectCompletion(stageId, supabaseUrl, supabaseKey);
            } catch (completionError) {
              console.error('[SubWebhook] Project completion check failed (non-critical):', completionError.message);
            }
          }
        }
        break;
      }

      default:
        console.log(`[SubWebhook] Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[SubWebhook] Error processing event: ${error.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ============================================
// EMAIL NOTIFICATION HELPER - STAGE PAYMENTS
// ============================================
async function sendPaymentEmails(stageId, supabaseUrl, supabaseKey) {
  console.log(`[SubWebhook] Fetching stage details for email notifications: ${stageId}`);
  
  // Fetch stage, project, and user details
  const stageResponse = await fetch(
    `${supabaseUrl}/rest/v1/stages?id=eq.${stageId}&select=*,projects!inner(id,project_name,client_name,client_email,share_code,currency,user_id,user_profiles!inner(email,name))`,
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
    console.log('[SubWebhook] No stage data found for email');
    return;
  }
  
  const stage = stageData[0];
  const project = stage.projects;
  const freelancer = project.user_profiles;
  
  console.log('[SubWebhook] Sending payment notification emails...');
  console.log('[SubWebhook] Stage:', stage.name, '| Stage Number:', stage.stage_number);
  console.log('[SubWebhook] Project:', project.project_name);
  console.log('[SubWebhook] Freelancer email:', freelancer.email);
  console.log('[SubWebhook] Client email:', project.client_email);
  console.log('[SubWebhook] Amount:', stage.amount, project.currency || 'USD');
  
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
          freelancerName: freelancer.name || 'there',
          projectName: project.project_name,
          stageName: stage.name || `Stage ${stage.stage_number}`,
          stageNumber: stage.stage_number,
          amount: stage.amount,
          currency: project.currency || 'USD',
          clientName: project.client_name,
          projectId: project.id,
        },
      }),
    });
    
    if (freelancerEmailResponse.ok) {
      console.log('[SubWebhook] ✅ Payment received email sent to freelancer');
    } else {
      const errorText = await freelancerEmailResponse.text();
      console.error('[SubWebhook] Failed to send freelancer email:', errorText);
    }
  } catch (error) {
    console.error('[SubWebhook] Error sending freelancer email:', error.message);
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
          stageNumber: stage.stage_number,
          amount: stage.amount,
          currency: project.currency || 'USD',
          freelancerName: freelancer.name || 'Your freelancer',
          portalUrl: `https://milestage.com/client/${project.share_code}`,
        },
      }),
    });
    
    if (clientEmailResponse.ok) {
      console.log('[SubWebhook] ✅ Payment confirmation email sent to client');
    } else {
      const errorText = await clientEmailResponse.text();
      console.error('[SubWebhook] Failed to send client email:', errorText);
    }
  } catch (error) {
    console.error('[SubWebhook] Error sending client email:', error.message);
  }
}

// ============================================
// EMAIL NOTIFICATION HELPER - EXTENSION PAYMENTS
// ============================================
async function sendExtensionEmails(stageId, amount, supabaseUrl, supabaseKey) {
  console.log(`[SubWebhook] Fetching stage details for extension email: ${stageId}`);
  
  // Fetch stage, project, and user details
  const stageResponse = await fetch(
    `${supabaseUrl}/rest/v1/stages?id=eq.${stageId}&select=*,projects!inner(id,project_name,client_name,client_email,share_code,currency,user_id,user_profiles!inner(email,name))`,
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
    console.log('[SubWebhook] No stage data found for extension email');
    return;
  }
  
  const stage = stageData[0];
  const project = stage.projects;
  const freelancer = project.user_profiles;
  
  console.log('[SubWebhook] Sending extension purchase emails...');
  console.log('[SubWebhook] Stage:', stage.name);
  console.log('[SubWebhook] Freelancer email:', freelancer.email);
  console.log('[SubWebhook] Amount:', amount);
  
  const emailApiUrl = process.env.VITE_APP_URL || 'https://milestage.com';
  
  // Send extension purchased email to freelancer
  try {
    const freelancerEmailResponse = await fetch(`${emailApiUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'extension_purchased',
        data: {
          freelancerEmail: freelancer.email,
          freelancerName: freelancer.name || 'there',
          projectName: project.project_name,
          stageName: stage.name || `Stage ${stage.stage_number}`,
          amount: amount,
          currency: project.currency || 'USD',
          clientName: project.client_name,
          referenceCode: 'Paid via Stripe',
          projectId: project.id,
          isPaidViaStripe: true,
        },
      }),
    });
    
    if (freelancerEmailResponse.ok) {
      console.log('[SubWebhook] ✅ Extension purchased email sent to freelancer');
    } else {
      const errorText = await freelancerEmailResponse.text();
      console.error('[SubWebhook] Failed to send extension email:', errorText);
    }
  } catch (error) {
    console.error('[SubWebhook] Error sending extension email:', error.message);
  }
}

// ============================================
// PROJECT COMPLETION CHECK
// ============================================
async function checkProjectCompletion(stageId, supabaseUrl, supabaseKey) {
  console.log(`[SubWebhook] Checking project completion for stage: ${stageId}`);
  
  // Get the stage and its project
  const stageResponse = await fetch(
    `${supabaseUrl}/rest/v1/stages?id=eq.${stageId}&select=id,stage_number,project_id,projects!inner(id,project_name,client_name,currency,user_id,status,user_profiles!inner(email,name))`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );
  
  if (!stageResponse.ok) {
    throw new Error(`Failed to fetch stage: ${stageResponse.statusText}`);
  }
  
  const stageData = await stageResponse.json();
  if (!stageData || stageData.length === 0) {
    console.log('[SubWebhook] No stage data found');
    return;
  }
  
  const stage = stageData[0];
  const project = stage.projects;
  const projectId = stage.project_id;
  
  // Skip if project already completed
  if (project.status === 'completed') {
    console.log('[SubWebhook] Project already completed, skipping');
    return;
  }
  
  // Get all stages for this project (excluding stage 0)
  const allStagesResponse = await fetch(
    `${supabaseUrl}/rest/v1/stages?project_id=eq.${projectId}&stage_number=gt.0&select=id,stage_number,payment_status&order=stage_number.asc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );
  
  if (!allStagesResponse.ok) {
    throw new Error(`Failed to fetch all stages: ${allStagesResponse.statusText}`);
  }
  
  const allStages = await allStagesResponse.json();
  
  if (!allStages || allStages.length === 0) {
    console.log('[SubWebhook] No stages found for project');
    return;
  }
  
  // Check if current stage is the last one
  const lastStageNumber = Math.max(...allStages.map(s => s.stage_number));
  const isLastStage = stage.stage_number === lastStageNumber;
  
  console.log(`[SubWebhook] Stage ${stage.stage_number} of ${lastStageNumber}, isLastStage: ${isLastStage}`);
  
  if (!isLastStage) {
    console.log('[SubWebhook] Not the last stage, skipping completion check');
    return;
  }
  
  // It's the last stage - mark project as completed
  console.log('[SubWebhook] Last stage paid! Marking project as completed...');
  
  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status: 'completed',
      }),
    }
  );
  
  if (!updateResponse.ok) {
    console.error(`[SubWebhook] Failed to update project status: ${updateResponse.statusText}`);
    return;
  }
  
  console.log('[SubWebhook] ✅ Project marked as completed');
  
  // Calculate total amount
  const totalAmount = allStages.reduce((sum, s) => sum + (s.amount || 0), 0);
  
  // Get stage 0 amount if exists
  const stage0Response = await fetch(
    `${supabaseUrl}/rest/v1/stages?project_id=eq.${projectId}&stage_number=eq.0&select=amount`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  );
  
  let stage0Amount = 0;
  if (stage0Response.ok) {
    const stage0Data = await stage0Response.json();
    if (stage0Data && stage0Data.length > 0) {
      stage0Amount = stage0Data[0].amount || 0;
    }
  }
  
  const grandTotal = totalAmount + stage0Amount;
  
  // Send completion email to freelancer
  const freelancer = project.user_profiles;
  const emailApiUrl = process.env.VITE_APP_URL || 'https://milestage.com';
  
  try {
    const emailResponse = await fetch(`${emailApiUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'project_completed',
        data: {
          freelancerEmail: freelancer.email,
          freelancerName: freelancer.name || 'there',
          projectName: project.project_name,
          clientName: project.client_name || 'Client',
          totalAmount: grandTotal.toString(),
          currency: project.currency || 'USD',
          projectId: projectId,
        },
      }),
    });
    
    if (emailResponse.ok) {
      console.log('[SubWebhook] ✅ Project completion email sent to freelancer');
    } else {
      const errorText = await emailResponse.text();
      console.error('[SubWebhook] Failed to send completion email:', errorText);
    }
  } catch (error) {
    console.error('[SubWebhook] Error sending completion email:', error.message);
  }
}
