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
    const { 
      to_email,
      client_name,
      project_name,
      stage_name,
      amount,
      currency,
      freelancer_name,
      days_overdue,
      share_code
    } = await req.json()

    // Validate required fields
    if (!to_email || !client_name || !project_name || !stage_name || !amount || !freelancer_name || !share_code) {
      throw new Error('Missing required fields')
    }

    // Format currency
    const formatAmount = (amount: number, curr: string) => {
      const symbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CAD': 'CA$',
        'AUD': 'AU$'
      }
      const symbol = symbols[curr] || curr
      return `${symbol}${amount.toLocaleString()}`
    }

    const formattedAmount = formatAmount(amount, currency || 'USD')
    const portalLink = `https://milestage.com/client/${share_code}`

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${freelancer_name} via MileStage <notifications@milestage.com>`,
        to: [to_email],
        subject: `Payment reminder - ${project_name}`,
        html: `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:0;background-color:#f9fafb}
.container{background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.header{background:#10b981;padding:24px;display:flex;align-items:center;justify-content:space-between}
.header-title{color:white;font-size:20px;font-weight:600;margin:0;flex:1}
.header-logo{height:32px;width:auto}
.content{padding:32px 24px}
.project-box{background:#f0fdf4;border-left:4px solid #10b981;padding:20px;margin:24px 0;border-radius:4px}
.project-box h3{margin:0 0 12px 0;color:#065f46;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
.project-box p{margin:6px 0;font-size:15px;color:#1f2937}
.amount{font-size:32px;font-weight:700;color:#10b981;margin:12px 0 0 0}
.button-container{text-align:center;margin:32px 0}
.button{display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;font-size:16px}
.footer{text-align:center;padding:24px;background:#f9fafb;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb}
.footer a{color:#10b981;text-decoration:none}
@media only screen and (max-width:600px){
.content{padding:24px 16px}
.header{padding:20px 16px}
.header-title{font-size:18px}
.header-logo{height:28px}
}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1 class="header-title">💳 Payment Reminder</h1>
<img src="https://milestage.com/logo.png" alt="MileStage" class="header-logo">
</div>
<div class="content">
<p>Hi ${client_name},</p>
<p>I hope this message finds you well!</p>
<p>This is a friendly reminder that payment for <strong>${stage_name}</strong> on the <strong>${project_name}</strong> project is due.</p>
<div class="project-box">
<h3>Payment Details</h3>
<p><strong>Project:</strong> ${project_name}</p>
<p><strong>Stage:</strong> ${stage_name}</p>
<p><strong>Amount Due:</strong></p>
<div class="amount">${formattedAmount}</div>
</div>
<div class="button-container">
<a href="${portalLink}" class="button">Pay ${formattedAmount} Now →</a>
</div>
<p style="margin-top:32px">If you've already sent payment, please disregard this message. If you have any questions or concerns, please don't hesitate to reach out.</p>
<p style="margin-top:24px">Thank you for your business!</p>
<p style="margin-top:32px">Best regards,<br><strong>${freelancer_name}</strong></p>
</div>
<div class="footer">
<p>Sent via <a href="https://milestage.com">MileStage</a></p>
<p style="margin-top:8px;font-size:12px">This is an automated reminder. Please reply directly to ${freelancer_name} if you have questions.</p>
</div>
</div>
</body>
</html>`,
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
    console.error('Payment reminder error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
