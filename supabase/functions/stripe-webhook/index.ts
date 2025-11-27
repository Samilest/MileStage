import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const sig = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !stripeSecretKey || !sig) {
    return new Response(
      JSON.stringify({ error: 'Missing configuration or signature' }),
      { status: 400, headers: corsHeaders }
    )
  }

  try {
    const body = await req.text()
    
    // Verify signature using Web Crypto API (Deno native)
    const timestamp = sig.split(',')[0].split('=')[1]
    const signatures = sig.split(',').slice(1).map(s => s.split('=')[1])
    
    const payload = `${timestamp}.${body}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    const expectedSig = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    if (!signatures.includes(expectedSig)) {
      console.error('[Webhook] ❌ Signature verification failed')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('[Webhook] ✅ Signature verified')
    
    const event = JSON.parse(body)
    console.log('[Webhook] Event type:', event.type)

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const stageId = paymentIntent.metadata?.stage_id
      const projectId = paymentIntent.metadata?.project_id

      console.log('[Webhook] 💰 Payment succeeded:', { stageId, projectId })

      if (stageId && projectId) {
        // Update stage using fetch (no Supabase client library)
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/stages?id=eq.${stageId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            payment_status: 'received',
            payment_received_at: new Date().toISOString()
          })
        })

        if (!updateRes.ok) {
          console.error('[Webhook] ❌ Update failed:', await updateRes.text())
          throw new Error('Failed to update stage')
        }

        const updated = await updateRes.json()
        console.log('[Webhook] ✅ Stage updated:', updated)

        // Get stages to unlock next
        const stagesRes = await fetch(
          `${supabaseUrl}/rest/v1/stages?project_id=eq.${projectId}&order=stage_number.asc&select=id,stage_number,status`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        )

        if (stagesRes.ok) {
          const stages = await stagesRes.json()
          const currentStage = stages.find((s: any) => s.id === stageId)
          const nextStage = stages.find((s: any) => 
            s.stage_number === (currentStage?.stage_number || 0) + 1
          )

          if (nextStage && nextStage.status === 'locked') {
            await fetch(`${supabaseUrl}/rest/v1/stages?id=eq.${nextStage.id}`, {
              method: 'PATCH',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: 'active' })
            })
            console.log('[Webhook] 🔓 Unlocked next stage')
          }
        }
      }
    }

    // Handle account.updated
    if (event.type === 'account.updated') {
      const account = event.data.object
      const userId = account.metadata?.user_id

      if (userId) {
        await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stripe_charges_enabled: account.charges_enabled || false,
            stripe_payouts_enabled: account.payouts_enabled || false,
            stripe_onboarding_completed: account.details_submitted || false,
            stripe_connected_at: account.details_submitted ? new Date().toISOString() : null
          })
        })
        console.log('[Webhook] ✅ Updated user')
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[Webhook] ❌ Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
