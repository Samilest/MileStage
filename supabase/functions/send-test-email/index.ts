import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to_email } = await req.json()

    if (!to_email) {
      throw new Error('to_email is required')
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MileStage <notifications@milestage.com>',
        to: [to_email],
        subject: '✅ Test Email from MileStage',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  padding: 30px;
                  border-radius: 10px;
                  text-align: center;
                  margin-bottom: 30px;
                }
                .content {
                  background: #f9fafb;
                  padding: 30px;
                  border-radius: 10px;
                  margin-bottom: 20px;
                }
                .success {
                  font-size: 48px;
                  margin: 0 0 10px 0;
                }
                .footer {
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="success">✅</div>
                <h1 style="margin: 0; font-size: 28px;">Email System Working!</h1>
              </div>
              
              <div class="content">
                <h2 style="color: #10b981; margin-top: 0;">Congratulations!</h2>
                <p>Your MileStage email system is configured correctly and ready to send emails.</p>
                
                <p><strong>What's working:</strong></p>
                <ul>
                  <li>✅ Resend API connected</li>
                  <li>✅ Domain verified (milestage.com)</li>
                  <li>✅ Supabase Edge Function working</li>
                  <li>✅ Emails delivering successfully</li>
                </ul>
                
                <p>You're now ready to implement the payment reminder system!</p>
              </div>
              
              <div class="footer">
                <p>Sent via MileStage • www.milestage.com</p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
