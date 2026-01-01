// API endpoint to send project invitation email to client
// File: api/send-project-invite.js

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      clientEmail, 
      clientName, 
      projectName, 
      freelancerName,
      portalLink 
    } = req.body;

    // Validate required fields
    if (!clientEmail || !projectName || !portalLink) {
      return res.status(400).json({ 
        error: 'Missing required fields: clientEmail, projectName, portalLink' 
      });
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'MileStage <notifications@milestage.com>',
      to: clientEmail,
      subject: `${freelancerName || 'Your freelancer'} invited you to ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media only screen and (max-width: 600px) {
                    .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
                    .mobile-title { font-size: 24px !important; }
                    .header-padding { padding: 32px 20px !important; }
                    .content-padding { padding: 32px 20px !important; }
                }
            </style>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <!-- Email Container -->
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header with Logo -->
                    <tr>
                      <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                        <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                        <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                          You've Been Invited!
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td class="content-padding" style="padding: 48px 40px;">
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                          Hi ${clientName || 'there'},
                        </p>
                        
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                          ${freelancerName || 'Your freelancer'} has invited you to track progress on <strong>${projectName}</strong>.
                        </p>
                        
                        <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                          You can view the project stages, track payments, and communicate directly through your client portal.
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding-bottom: 32px;">
                              <a href="${portalLink}" 
                                 style="display: inline-block; padding: 16px 32px; background-color: #10B981; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                View Your Project Portal
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6B7280;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #10B981; word-break: break-all;">
                          ${portalLink}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; border-top: 1px solid #E5E7EB; text-align: center;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">
                          Sent via <strong>MileStage</strong>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                          Track project stages, revisions, and payments—all in one place.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Legal Footer -->
                  <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                      <td style="padding: 0 20px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
                          This email was sent because ${freelancerName || 'a freelancer'} added you to a project on MileStage.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      // Plain text fallback
      text: `
Hi ${clientName || 'there'},

${freelancerName || 'Your freelancer'} has invited you to track progress on ${projectName}.

View your project portal: ${portalLink}

You can view the project stages, track payments, and communicate directly through your client portal.

---
Sent via MileStage
Track project stages, revisions, and payments—all in one place.
      `.trim()
    });

    if (error) {
      console.error('[Send Project Invite] Resend error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('[Send Project Invite] Email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      messageId: data.id 
    });

  } catch (error) {
    console.error('[Send Project Invite] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
