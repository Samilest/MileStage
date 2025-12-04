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
    const { to_email, user_name } = await req.json()

    if (!to_email) {
      throw new Error('to_email is required')
    }

    const name = user_name || 'there'

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
        subject: 'Welcome to MileStage! 🎉',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MileStage</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo {
                height: 32px !important;
                margin-bottom: 16px !important;
            }
            .mobile-title {
                font-size: 24px !important;
            }
            .header-padding {
                padding: 32px 20px !important;
            }
            .content-padding {
                padding: 32px 20px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/milestage-logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                Welcome to MileStage!
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${name}</strong>! 👋
                            </div>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                Track milestone payments and prevent scope creep. Clients can't start the next stage until they pay—no awkward conversations needed.
                            </div>

                            <!-- Quick Start Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 16px; font-weight: 600; color: #10B981; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Quick Start
                                        </div>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <div style="font-size: 15px; color: #374151; line-height: 1.6;">
                                                <strong>1. Create your first project</strong><br/>
                                                <span style="color: #6B7280;">Choose a template or start from scratch</span>
                                            </div>
                                        </div>

                                        <div style="margin-bottom: 12px;">
                                            <div style="font-size: 15px; color: #374151; line-height: 1.6;">
                                                <strong>2. Add stages and amounts</strong><br/>
                                                <span style="color: #6B7280;">Break your project into clear milestones</span>
                                            </div>
                                        </div>

                                        <div style="margin-bottom: 12px;">
                                            <div style="font-size: 15px; color: #374151; line-height: 1.6;">
                                                <strong>3. Send to your client</strong><br/>
                                                <span style="color: #6B7280;">They get a professional payment portal</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div style="font-size: 15px; color: #374151; line-height: 1.6;">
                                                <strong>4. Get paid automatically</strong><br/>
                                                <span style="color: #6B7280;">Track payments and send reminders with one click</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Create First Project
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
                                Need help? Visit our <a href="https://milestage.com/faq" style="color: #10B981; text-decoration: none; font-weight: 500;">FAQ</a> or <a href="mailto:support@milestage.com" style="color: #10B981; text-decoration: none; font-weight: 500;">contact us</a>.
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                You're receiving this because you signed up for MileStage.
                                <br/>
                                <a href="https://milestage.com" style="color: #10B981; text-decoration: none;">Visit MileStage</a>
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
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
