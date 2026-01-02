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
      case 'payment_marked':
        emailData = await buildPaymentMarkedEmail(data);
        break;
      case 'extension_purchased':
        emailData = await buildExtensionPurchasedEmail(data);
        break;
      case 'payment_verified':
        emailData = await buildPaymentVerifiedEmail(data);
        break;
      case 'payment_rejected':
        emailData = await buildPaymentRejectedEmail(data);
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
  const { clientEmail, clientName, projectName, stageName, amount, currency, portalUrl } = data;
  
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
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
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
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
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
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
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
                        <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
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
                            <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 16px 20px; border-radius: 8px; margin-bottom: 32px;">
                                <div style="font-size: 14px; color: #92400E; font-weight: 600; margin-bottom: 8px;">Client Feedback:</div>
                                <div style="font-size: 14px; color: #78350F; line-height: 1.6;">${feedback}</div>
                            </div>
                            ` : ''}

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
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
  const { clientName, projectName, stageName, amount, currency, portalUrl } = data;
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
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
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

                            <div style="font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 32px;">
                                The next stage is now unlocked. Thank you for your payment!
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0;">
                                        <a href="${portalUrl}" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
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


// ============================================
// PAYMENT MARKED (Offline) - To Freelancer
// ============================================

async function buildPaymentMarkedEmail(data) {
  const { freelancerEmail, freelancerName, projectName, stageName, amount, currency, clientName, referenceCode } = data;
  
  return {
    from: "MileStage <notifications@milestage.com>",
    to: freelancerEmail,
    subject: `💳 ${clientName} marked payment sent - ${projectName}`,
    html: generatePaymentMarkedHTML(data),
  };
}

function generatePaymentMarkedHTML(data) {
  const { freelancerName, projectName, stageName, amount, currency, clientName, referenceCode } = data;
  const name = freelancerName || "there";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Marked</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                💳 Payment Pending Verification
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>\${name}</strong>,
                            </div>
                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                <strong>\${clientName}</strong> has marked their payment as sent for <strong>\${stageName}</strong> on <strong>\${projectName}</strong>.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 13px; font-weight: 600; color: #92400E; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;">Payment Details</div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #92400E; margin-bottom: 4px;">Amount</div>
                                            <div style="font-size: 24px; font-weight: 700; color: #78350F;">\${currency}\${amount}</div>
                                        </div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #92400E; margin-bottom: 4px;">Stage</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #78350F;">\${stageName}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 14px; color: #92400E; margin-bottom: 4px;">Reference Code</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #78350F; font-family: monospace;">\${referenceCode}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div style="font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 32px;">
                                Please verify you have received this payment and mark it as received in your dashboard.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Verify Payment
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                Sent via MileStage<br/>
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

// ============================================
// EXTENSION PURCHASED - To Freelancer
// ============================================

async function buildExtensionPurchasedEmail(data) {
  const { freelancerEmail, freelancerName, projectName, stageName, amount, currency, clientName, referenceCode } = data;
  
  return {
    from: "MileStage <notifications@milestage.com>",
    to: freelancerEmail,
    subject: `💎 ${clientName} purchased extra revision - ${projectName}`,
    html: generateExtensionPurchasedHTML(data),
  };
}

function generateExtensionPurchasedHTML(data) {
  const { freelancerName, projectName, stageName, amount, currency, clientName, referenceCode } = data;
  const name = freelancerName || "there";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extra Revision Purchased</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-logo { height: 32px !important; margin-bottom: 16px !important; }
            .mobile-title { font-size: 24px !important; }
            .header-padding { padding: 32px 20px !important; }
            .content-padding { padding: 32px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                💎 Extra Revision Purchased
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>\${name}</strong>,
                            </div>
                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                <strong>\${clientName}</strong> has purchased an extra revision for <strong>\${stageName}</strong> on <strong>\${projectName}</strong>.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 13px; font-weight: 600; color: #6D28D9; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;">Purchase Details</div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6D28D9; margin-bottom: 4px;">Amount</div>
                                            <div style="font-size: 24px; font-weight: 700; color: #5B21B6;">\${currency}\${amount}</div>
                                        </div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #6D28D9; margin-bottom: 4px;">Stage</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #5B21B6;">\${stageName}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 14px; color: #6D28D9; margin-bottom: 4px;">Reference Code</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #5B21B6; font-family: monospace;">\${referenceCode}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div style="font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 32px;">
                                Please verify you have received this payment in your dashboard. Once verified, the extra revision will be added to the stage.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="https://milestage.com/dashboard" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Verify Payment
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                Sent via MileStage<br/>
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


// ============================================
// PAYMENT VERIFIED - To Client
// ============================================

async function buildPaymentVerifiedEmail(data) {
  const { clientEmail, clientName, projectName, stageName, amount, currency, freelancerName, portalUrl } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: clientEmail,
    subject: `✅ Payment Verified - ${stageName} on ${projectName}`,
    html: generatePaymentVerifiedHTML(data),
  };
}

function generatePaymentVerifiedHTML(data) {
  const { clientName, projectName, stageName, amount, currency, freelancerName, portalUrl } = data;
  const name = clientName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Verified</title>
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
                    <tr>
                        <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                ✅ Payment Verified!
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${name}</strong>,
                            </div>
                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                Great news! <strong>${freelancerName}</strong> has verified your payment for <strong>${stageName}</strong> on <strong>${projectName}</strong>.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 13px; font-weight: 600; color: #065F46; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;">Payment Confirmed</div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #065F46; margin-bottom: 4px;">Amount</div>
                                            <div style="font-size: 24px; font-weight: 700; color: #047857;">${currency}${amount}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 14px; color: #065F46; margin-bottom: 4px;">Stage</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #047857;">${stageName}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div style="font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 32px;">
                                The stage is now complete and the next stage has been unlocked.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="${portalUrl}" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            View Project
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                Sent via MileStage<br/>
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

// ============================================
// PAYMENT REJECTED - To Client
// ============================================

async function buildPaymentRejectedEmail(data) {
  const { clientEmail, clientName, projectName, stageName, amount, currency, freelancerName, portalUrl } = data;
  
  return {
    from: 'MileStage <notifications@milestage.com>',
    to: clientEmail,
    subject: `❌ Payment Not Received - ${stageName} on ${projectName}`,
    html: generatePaymentRejectedHTML(data),
  };
}

function generatePaymentRejectedHTML(data) {
  const { clientName, projectName, stageName, amount, currency, freelancerName, portalUrl } = data;
  const name = clientName || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Not Received</title>
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
                    <tr>
                        <td class="header-padding" style="background-color: #10B981; padding: 48px 40px; text-align: center;">
                            <img src="https://milestage.com/assets/Menu-Logo.png" alt="MileStage" class="mobile-logo" style="height: 48px; display: block; margin: 0 auto 24px auto;" />
                            <div class="mobile-title" style="font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                                ❌ Payment Not Received
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-padding" style="padding: 48px 40px;">
                            <div style="font-size: 18px; color: #111827; margin-bottom: 24px; line-height: 1.6;">
                                Hi <strong>${name}</strong>,
                            </div>
                            <div style="font-size: 16px; color: #374151; margin-bottom: 32px; line-height: 1.7;">
                                <strong>${freelancerName}</strong> could not verify your payment for <strong>${stageName}</strong> on <strong>${projectName}</strong>.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 28px 32px;">
                                        <div style="font-size: 13px; font-weight: 600; color: #065F46; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px;">Payment Issue</div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="font-size: 14px; color: #065F46; margin-bottom: 4px;">Amount</div>
                                            <div style="font-size: 24px; font-weight: 700; color: #047857;">${currency}${amount}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 14px; color: #065F46; margin-bottom: 4px;">Stage</div>
                                            <div style="font-size: 16px; font-weight: 500; color: #047857;">${stageName}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div style="font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 32px;">
                                Please try again or contact the freelancer directly to resolve this issue.
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px 0;">
                                        <a href="${portalUrl}" style="display: inline-block; background-color: #10B981; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                            Try Again
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <div style="text-align: center; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
                                Sent via MileStage<br/>
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
