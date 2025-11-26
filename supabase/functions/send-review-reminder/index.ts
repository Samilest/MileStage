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
      days_overdue
    } = await req.json()

    // Validate required fields
    if (!to_email || !client_name || !project_name || !stage_name || !amount || !freelancer_name) {
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
        subject: `Work ready for review - ${project_name}`,
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
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
                  background: #eff6ff;
                  border-left: 4px solid #3b82f6;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                .project-details h3 {
                  margin: 0 0 10px 0;
                  color: #1e40af;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .project-details p {
                  margin: 8px 0;
                  font-size: 16px;
                }
                .amount {
                  font-size: 28px;
                  font-weight: bold;
                  color: #1e40af;
                  margin: 10px 0;
                }
                .button {
                  display: inline-block;
                  background: #3b82f6;
                  color: white;
                  text-decoration: none;
                  padding: 14px 32px;
                  border-radius: 6px;
                  font-weight: 600;
                  margin: 20px 0;
                  text-align: center;
                }
                .button:hover {
                  background: #2563eb;
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
                  color: #3b82f6;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📋 Work Ready for Review</h1>
                </div>
                
                <div class="content">
                  <p>Hi ${client_name},</p>
                  
                  <p>I hope you're doing well!</p>
                  
                  <p>I've completed and delivered the work for <strong>${stage_name}</strong> on the <strong>${project_name}</strong> project.</p>

                  <p><strong>Please review the deliverables when you have a chance.</strong></p>

                  <div class="project-details">
                    <h3>Project Details</h3>
                    <p><strong>Project:</strong> ${project_name}</p>
                    <p><strong>Stage:</strong> ${stage_name}</p>
                    <p><strong>Stage Amount:</strong></p>
                    <div class="amount">${formattedAmount}</div>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                      Log in to your project portal to review the work:
                    </p>
                    <a href="https://milestage.com" class="button">
                      Review Work →
                    </a>
                  </div>

                  <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                    Once you approve the work, you'll be able to proceed with payment and unlock the next stage.
                  </p>

                  <p style="margin-top: 30px;">
                    Looking forward to your feedback!
                  </p>

                  <p style="margin-top: 20px;">
                    Best regards,<br>
                    <strong>${freelancer_name}</strong>
                  </p>
                </div>

                <div class="footer">
                  <p>Sent via <a href="https://milestage.com">MileStage</a></p>
                  <p style="margin-top: 10px; font-size: 12px;">
                    This is an automated reminder. Please reply directly to ${freelancer_name} if you have questions.
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
    console.error('Review reminder error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
