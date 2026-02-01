// api/stripe/confirm-extension-payment.js
// Simple endpoint to create extension record after successful Stripe payment

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stageId } = req.body;

  if (!stageId) {
    return res.status(400).json({ error: 'Missing stageId' });
  }

  try {
    console.log('[Confirm Extension] Processing extension for stage:', stageId);

    // 1. Check if a 'paid' extension already exists (prevent duplicates)
    const { data: existingExtension } = await supabaseAdmin
      .from('extensions')
      .select('id')
      .eq('stage_id', stageId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingExtension && existingExtension.length > 0) {
      console.log('[Confirm Extension] Extension already exists:', existingExtension[0].id);
      return res.status(200).json({ 
        success: true,
        message: 'Extension already added',
        alreadyProcessed: true
      });
    }

    // 2. Get stage details for the extension amount and email
    const { data: stageDetails, error: fetchError } = await supabaseAdmin
      .from('stages')
      .select(`
        id,
        name,
        stage_number,
        extension_price,
        project_id,
        projects!inner (
          id,
          project_name,
          client_name,
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

    if (fetchError || !stageDetails) {
      console.error('[Confirm Extension] Error fetching stage:', fetchError);
      return res.status(404).json({ error: 'Stage not found' });
    }

    // 3. Create the extension record
    const extensionAmount = stageDetails.extension_price || 0;
    const referenceCode = `STRIPE-${Date.now().toString(36).toUpperCase()}`;

    const { data: newExtension, error: extensionError } = await supabaseAdmin
      .from('extensions')
      .insert({
        stage_id: stageId,
        amount: extensionAmount,
        reference_code: referenceCode,
        status: 'paid',
        marked_paid_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        additional_revisions: 1,
      })
      .select()
      .single();

    if (extensionError) {
      console.error('[Confirm Extension] Error creating extension:', extensionError);
      return res.status(500).json({ error: 'Failed to create extension' });
    }

    console.log('[Confirm Extension] ✅ Extension created:', newExtension.id);

    // 4. Send email notification to freelancer (non-blocking)
    const project = stageDetails.projects;
    const freelancer = project.user_profiles;
    const emailApiUrl = process.env.VITE_APP_URL || 'https://milestage.com';

    try {
      console.log('[Confirm Extension] Sending email to:', freelancer.email);
      
      const emailResponse = await fetch(`${emailApiUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'extension_purchased',
          data: {
            freelancerEmail: freelancer.email,
            freelancerName: freelancer.name || 'there',
            projectName: project.project_name,
            stageName: stageDetails.name || `Stage ${stageDetails.stage_number}`,
            amount: extensionAmount,
            currency: project.currency || 'USD',
            clientName: project.client_name || 'Your client',
            referenceCode: 'Paid via Stripe',
            projectId: project.id,
            isPaidViaStripe: true,
          },
        }),
      });

      if (emailResponse.ok) {
        console.log('[Confirm Extension] ✅ Email sent to freelancer');
      } else {
        console.error('[Confirm Extension] Email failed:', await emailResponse.text());
      }
    } catch (emailError) {
      console.error('[Confirm Extension] Email error:', emailError.message);
      // Don't fail the request - extension was created successfully
    }

    return res.status(200).json({ 
      success: true,
      message: 'Extension added successfully',
      extensionId: newExtension.id
    });

  } catch (error) {
    console.error('[Confirm Extension] Error:', error);
    return res.status(500).json({ error: 'Failed to process extension' });
  }
};
