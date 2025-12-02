import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!
    
    // Verify Stripe signature
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
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expectedSig = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    if (!signatures.includes(expectedSig)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.type === 'payment_intent.succeeded') {
      const stageId = event.data.object.metadata?.stage_id
      const projectId = event.data.object.metadata?.project_id

      if (stageId && projectId) {
        // Update stage
        await fetch(`${supabaseUrl}/rest/v1/stages?id=eq.${stageId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_status: 'received',
            payment_received_at: new Date().toISOString(),
            status: 'completed'
          })
        })

        // Get and unlock next stage
        const stagesRes = await fetch(
          `${supabaseUrl}/rest/v1/stages?project_id=eq.${projectId}&order=stage_number.asc&select=id,stage_number,status`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            }
          }
        )

        const stages = await stagesRes.json()
        const currentStage = stages.find((s: any) => s.id === stageId)
        const nextStage = stages.find((s: any) => 
          s.stage_number === (currentStage?.stage_number || 0) + 1
        )

        if (nextStage?.status === 'locked') {
          await fetch(`${supabaseUrl}/rest/v1/stages?id=eq.${nextStage.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'active' })
          })
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})