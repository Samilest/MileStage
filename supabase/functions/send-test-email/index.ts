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
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/milestage-logo.png" alt="MileStage" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                            <div style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                Email System Working!
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            
                            <div style="font-size: 24px; font-weight: 600; color: #10B981; margin-bottom: 24px;">
                                Congratulations! 🎉
                            </div>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                Your MileStage email system is configured correctly and ready to send emails.
                            </div>

                            <!-- Success Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 16px; font-weight: 600; color: #065F46; margin-bottom: 16px;">
                                            What's Working:
                                        </div>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size: 15px; color: #047857; line-height: 2; padding: 4px 0;">
                                                    ✓ Resend API connected
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; color: #047857; line-height: 2; padding: 4px 0;">
                                                    ✓ Domain verified (milestage.com)
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; color: #047857; line-height: 2; padding: 4px 0;">
                                                    ✓ Supabase Edge Function working
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; color: #047857; line-height: 2; padding: 4px 0;">
                                                    ✓ Emails delivering successfully
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; color: #047857; line-height: 2; padding: 4px 0;">
                                                    ✓ New email templates deployed
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size: 16px; color: #374151; line-height: 1.7; text-align: center; margin-bottom: 32px;">
                                You're now ready to send beautiful, professional emails to your clients!
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Go to Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                This is a test email from MileStage.
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
