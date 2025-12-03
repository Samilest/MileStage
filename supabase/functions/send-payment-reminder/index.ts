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
      freelancer_email,
      days_overdue,
      due_date,
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

    // Build overdue alert box (only if overdue)
    const overdueAlertHTML = days_overdue ? `
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px 20px; border-radius: 8px; margin-bottom: 32px;">
        <div style="font-size: 14px; color: #92400E; line-height: 1.6;">
          <strong>⏰ ${days_overdue} days overdue</strong>
        </div>
      </div>
    ` : '';

    // Send email via Resend using NEW TEMPLATE
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${freelancer_name} (via MileStage) <notifications@milestage.com>`,
        to: [to_email],
        reply_to: freelancer_email || undefined,
        subject: `Payment Reminder - ${project_name}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #10B981; padding: 32px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="180" style="vertical-align: middle;">
                                        <img src="https://milestage.com/assets/milestage-logo.png" alt="MileStage" style="height: 40px; display: block;" />
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <div style="font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                            💳 Payment Reminder
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            
                            <!-- Greeting -->
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${client_name}</strong>,
                            </div>

                            <!-- Main Message -->
                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                This is a friendly reminder that payment for <strong>${stage_name}</strong> was due${due_date ? ` on <strong>${due_date}</strong>` : ''}.
                            </div>

                            <!-- Days Overdue (Optional) -->
                            ${overdueAlertHTML}

                            <!-- Project Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 40px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 13px; font-weight: 600; color: #10B981; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;">
                                            Payment Details
                                        </div>
                                        
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Project</div>
                                            <div style="font-size: 18px; font-weight: 600; color: #111827;">${project_name}</div>
                                        </div>

                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Stage</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #374151;">${stage_name}</div>
                                        </div>

                                        ${due_date ? `
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Due Date</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #374151;">${due_date}</div>
                                        </div>
                                        ` : ''}

                                        <div>
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Amount Due</div>
                                            <div style="font-size: 28px; font-weight: 700; color: #10B981;">${formattedAmount}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="${portalLink}" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Make Payment →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Additional Info -->
                            <div style="font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                                If you've already sent payment, please disregard this message.
                            </div>

                            <div style="font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
                                Questions? Reply to this email or contact me directly.
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <div style="font-size: 14px; color: #374151; margin-bottom: 8px;">
                                    <strong>${freelancer_name}</strong> (via MileStage)
                                </div>
                                ${freelancer_email ? `
                                <div style="font-size: 13px; color: #6B7280;">
                                    ${freelancer_email}
                                </div>
                                ` : ''}
                            </div>
                            
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                This email was sent by ${freelancer_name} through MileStage, a milestone payment tracker for freelancers.
                                <br/>
                                <a href="https://milestage.com" style="color: #10B981; text-decoration: none;">Learn more about MileStage</a>
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
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
