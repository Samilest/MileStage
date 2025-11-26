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
      payment_link
    } = await req.json()

    // Validate required fields
    if (!to_email || !client_name || !project_name || !stage_name || !amount || !freelancer_name) {
      throw new Error('Missing required fields')
    }

    // Determine tone based on days overdue
    const getTone = () => {
      if (days_overdue >= 14) return 'urgent'
      if (days_overdue >= 7) return 'followup'
      return 'friendly'
    }

    const tone = getTone()

    // Email subject based on tone
    const subjects = {
      friendly: `Payment reminder - ${project_name}`,
      followup: `Following up on payment - ${project_name}`,
      urgent: `Urgent: Payment required - ${project_name}`
    }

    // Opening line based on tone
    const openings = {
      friendly: `I hope this message finds you well!`,
      followup: `I wanted to follow up regarding the payment for ${stage_name}.`,
      urgent: `This is an urgent reminder regarding the outstanding payment for ${stage_name}.`
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
        reply_to: to_email, // This should be freelancer's email - we'll add it in next iteration
        subject: subjects[tone],
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
                  background-color: #f9fafb;
                }
                .container {
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header {
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
                }
                .content {
                  padding: 30px;
                }
                .project-details {
                  background: #f9fafb;
                  border-left: 4px solid #10b981;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                .project-details h3 {
                  margin: 0 0 10px 0;
                  color: #10b981;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .project-details p {
                  margin: 8px 0;
                  font-size: 16px;
                }
                .amount {
                  font-size: 32px;
                  font-weight: bold;
                  color: #10b981;
                  margin: 10px 0;
                }
                .button {
                  display: inline-block;
                  background: #10b981;
                  color: white;
                  text-decoration: none;
                  padding: 14px 32px;
                  border-radius: 6px;
                  font-weight: 600;
                  margin: 20px 0;
                  text-align: center;
                }
                .button:hover {
                  background: #059669;
                }
                .footer {
                  text-align: center;
                  padding: 20px 30px;
                  background: #f9fafb;
                  color: #6b7280;
                  font-size: 14px;
                  border-top: 1px solid #e5e7eb;
                }
                .footer a {
                  color: #10b981;
                  text-decoration: none;
                }
                ${tone === 'urgent' ? '.urgent-banner { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; color: #991b1b; }' : ''}
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>💳 Payment Reminder</h1>
                </div>
                
                <div class="content">
                  ${tone === 'urgent' ? '<div class="urgent-banner"><strong>⚠️ Urgent:</strong> This payment is now ' + days_overdue + ' days overdue.</div>' : ''}
                  
                  <p>Hi ${client_name},</p>
                  
                  <p>${openings[tone]}</p>
                  
                  <p>This is a ${tone === 'urgent' ? 'final' : 'friendly'} reminder that payment for <strong>${stage_name}</strong> on the <strong>${project_name}</strong> project is ${days_overdue > 0 ? 'now ' + days_overdue + ' days overdue' : 'due'}.</p>

                  <div class="project-details">
                    <h3>Payment Details</h3>
                    <p><strong>Project:</strong> ${project_name}</p>
                    <p><strong>Stage:</strong> ${stage_name}</p>
                    <p><strong>Amount Due:</strong></p>
                    <div class="amount">${formattedAmount}</div>
                  </div>

                  ${payment_link ? `
                    <div style="text-align: center;">
                      <a href="${payment_link}" class="button">
                        Pay ${formattedAmount} Now →
                      </a>
                    </div>
                  ` : ''}

                  <p style="margin-top: 30px;">If you've already sent payment, please disregard this message. If you have any questions or concerns, please don't hesitate to reach out.</p>

                  <p style="margin-top: 20px;">
                    ${tone === 'urgent' ? 'Your prompt attention to this matter would be greatly appreciated.' : 'Thank you for your business!'}
                  </p>

                  <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>${freelancer_name}</strong>
                  </p>
                </div>

                <div class="footer">
                  <p>Sent via <a href="https://milestage.com">MileStage</a></p>
                  <p style="margin-top: 10px; font-size: 12px;">
                    This is an automated payment reminder. Please do not reply to this email.
                  </p>
                </div>
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
