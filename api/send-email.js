// api/send-email.js - Email notification service matching MileStage brand
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  try {
    let emailData;

    switch (type) {
      case 'payment_received':
        emailData = await buildPaymentReceivedEmail(data);
        break;
      case 'stage_delivered':
        emailData = await buildStageDeliveredEmail(data);
        break;
      case 'stage_approved':
        emailData = await buildStageApprovedEmail(data);
        break;
      case 'revision_requested':
        emailData = await buildRevisionRequestedEmail(data);
        break;
      case 'payment_confirmation':
        emailData = await buildPaymentConfirmationEmail(data);
        break;
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    const { data: result, error } = await resend.emails.send(emailData);

    if (error) {
      console.error(`[Email] Error sending ${type}:`, error);
      return res.status(400).json({ error: error.message });
    }

    console.log(`[Email] Sent ${type} email:`, result.id);
    return res.status(200).json({ success: true, messageId: result.id });

  } catch (error) {
    console.error(`[Email] Error:`, error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================
// EMAIL BUILDERS - Matching MileStage Brand
// ============================================

async function buildPaymentReceivedEmail(data) {
  const { freelancerEmail, freelancerName, projectName, stageName, amount, currency } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: freelancerEmail,
    subject: `💰 Payment Received - ${projectName}`,
    html: generatePaymentReceivedHTML(data),
  };
}

async function buildStageDeliveredEmail(data) {
  const { clientEmail, clientName, projectName, stageName, freelancerName, portalUrl } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: clientEmail,
    subject: `${freelancerName} delivered work for ${stageName}`,
    html: generateStageDeliveredHTML(data),
  };
}

async function buildStageApprovedEmail(data) {
  const { freelancerEmail, freelancerName, projectName, stageName, clientName } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: freelancerEmail,
    subject: `✅ ${clientName} approved ${stageName}`,
    html: generateStageApprovedHTML(data),
  };
}

async function buildRevisionRequestedEmail(data) {
  const { freelancerEmail, freelancerName, projectName, stageName, clientName, feedback } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: freelancerEmail,
    subject: `⚠️ Revision requested - ${projectName}`,
    html: generateRevisionRequestedHTML(data),
  };
}

async function buildPaymentConfirmationEmail(data) {
  const { clientEmail, clientName, projectName, stageName, amount, currency } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: clientEmail,
    subject: `✅ Payment confirmed for ${stageName}`,
    html: generatePaymentConfirmationHTML(data),
  };
}

// ============================================
// HTML GENERATORS - Matching Existing Templates
// ============================================

function generatePaymentReceivedHTML(data) {
  const { freelancerName, projectName, stageName, amount, currency } = data;
  const name = freelancerName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Received</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
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
                                💰 Payment Received!
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
                                Great news! You've received a payment for <strong>${projectName}</strong>.
                            </div>

                            <!-- Payment Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 40px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 13px; font-weight: 600; color: #10B981; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;">
                                            Payment Details
                                        </div>
                                        
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Project</div>
                                            <div style="font-size: 18px; font-weight: 600; color: #111827;">${projectName}</div>
                                        </div>

                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Stage</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #374151;">${stageName}</div>
                                        </div>

                                        <div>
                                            <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Amount Received</div>
                                            <div style="font-size: 28px; font-weight: 700; color: #10B981;">${currency}${amount}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                The next stage is now unlocked and ready for work!
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            View Project
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
                                Sent via MileStage
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
</html>`;
}

function generateStageDeliveredHTML(data) {
  const { clientName, projectName, stageName, freelancerName, portalUrl } = data;
  const name = clientName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Delivered</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
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
                                ✅ Work Delivered
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${name}</strong>,
                            </div>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                ${freelancerName} has delivered work for <strong>${stageName}</strong> on the <strong>${projectName}</strong> project.
                            </div>

                            <!-- Stage Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 40px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px;">${stageName}</div>
                                        <div style="font-size: 14px; color: #6B7280;">Ready for your review</div>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                Please review the deliverables and either approve the work or request revisions.
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="${portalUrl}" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Review Work
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
                                Sent via MileStage
                                <br/>
                                <a href="https://milestage.com" style="color: #10B981; text-decoration: none;">Learn more</a>
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateStageApprovedHTML(data) {
  const { freelancerName, projectName, stageName, clientName } = data;
  const name = freelancerName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stage Approved</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
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
                                ✅ Stage Approved
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
                                ${clientName} has approved <strong>${stageName}</strong> on <strong>${projectName}</strong>!
                            </div>

                            <!-- Stage Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 40px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px;">${stageName}</div>
                                        <div style="font-size: 14px; font-weight: 600; color: #10B981;">✅ APPROVED</div>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                Waiting for payment to unlock the next stage.
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            View Project
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
                                Sent via MileStage
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
</html>`;
}

function generateRevisionRequestedHTML(data) {
  const { freelancerName, projectName, stageName, clientName, feedback } = data;
  const name = freelancerName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revision Requested</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
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
                        <td class="header-padding" style="background-color: #F59E0B; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/milestage-logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                ⚠️ Revision Requested
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${name}</strong>,
                            </div>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                ${clientName} has requested a revision on <strong>${stageName}</strong> for <strong>${projectName}</strong>.
                            </div>

                            ${feedback ? `
                            <!-- Feedback Box -->
                            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px 20px; border-radius: 8px; margin-bottom: 32px;">
                                <div style="font-size: 14px; color: #92400E; font-weight: 600; margin-bottom: 8px;">Client Feedback:</div>
                                <div style="font-size: 14px; color: #78350F; line-height: 1.6;">${feedback}</div>
                            </div>
                            ` : ''}

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #F59E0B; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            View Details
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
                                Sent via MileStage
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
</html>`;
}

function generatePaymentConfirmationHTML(data) {
  const { clientName, projectName, stageName, amount, currency } = data;
  const name = clientName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
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
                                ✅ Payment Confirmed
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${name}</strong>,
                            </div>

                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                Your payment for <strong>${stageName}</strong> on <strong>${projectName}</strong> has been confirmed.
                            </div>

                            <!-- Payment Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 40px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Amount Paid</div>
                                        <div style="font-size: 28px; font-weight: 700; color: #10B981; margin-bottom: 16px;">${currency}${amount}</div>
                                        <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Stage</div>
                                        <div style="font-size: 16px; font-weight: 500; color: #374151;">${stageName}</div>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size: 16px; color: #374151; line-height: 1.7;">
                                The next stage is now unlocked. Thank you for your payment!
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                Sent via MileStage
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
</html>`;
}
