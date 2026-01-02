// src/lib/email.ts - Email notification helpers

export async function sendEmail(type: string, data: any) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Email] Sent ${type}:`, result.id);
    return result;
  } catch (error: any) {
    console.error(`[Email] Failed to send ${type}:`, error);
    // Don't throw - email failures shouldn't break the app
    return { error: error.message };
  }
}

// Convenience functions for each email type

export async function notifyPaymentReceived(params: {
  freelancerEmail: string;
  freelancerName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
}) {
  return sendEmail('payment_received', params);
}

export async function notifyStageDelivered(params: {
  clientEmail: string;
  clientName: string;
  projectName: string;
  stageName: string;
  freelancerName: string;
  portalUrl: string;
}) {
  return sendEmail('stage_delivered', params);
}

export async function notifyStageApproved(params: {
  freelancerEmail: string;
  freelancerName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  clientName: string;
}) {
  return sendEmail('stage_approved', params);
}

export async function notifyRevisionRequested(params: {
  freelancerEmail: string;
  freelancerName: string;
  projectName: string;
  stageName: string;
  clientName: string;
  feedback?: string;
  projectId?: string;
}) {
  return sendEmail('revision_requested', params);
}

export async function notifyPaymentConfirmation(params: {
  clientEmail: string;
  clientName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  portalUrl: string;
}) {
  return sendEmail('payment_confirmation', params);
}

export async function notifyPaymentMarked(params: {
  freelancerEmail: string;
  freelancerName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  clientName: string;
  referenceCode: string;
  projectId?: string;
}) {
  return sendEmail('payment_marked', params);
}

export async function notifyExtensionPurchased(params: {
  freelancerEmail: string;
  freelancerName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  clientName: string;
  referenceCode: string;
  projectId?: string;
}) {
  return sendEmail('extension_purchased', params);
}

export async function notifyPaymentVerified(params: {
  clientEmail: string;
  clientName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  freelancerName: string;
  portalUrl: string;
}) {
  return sendEmail('payment_verified', params);
}

export async function notifyPaymentRejected(params: {
  clientEmail: string;
  clientName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  freelancerName: string;
  portalUrl: string;
}) {
  return sendEmail('payment_rejected', params);
}

// Extension verify/reject emails to client
export async function notifyExtensionVerified(params: {
  clientEmail: string;
  clientName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  freelancerName: string;
  portalUrl: string;
}) {
  return sendEmail('extension_verified', params);
}

export async function notifyExtensionRejected(params: {
  clientEmail: string;
  clientName: string;
  projectName: string;
  stageName: string;
  amount: string;
  currency: string;
  freelancerName: string;
  portalUrl: string;
}) {
  return sendEmail('extension_rejected', params);
}

// Project completed email to freelancer
export async function notifyProjectCompleted(params: {
  freelancerEmail: string;
  freelancerName: string;
  projectName: string;
  clientName: string;
  totalAmount: string;
  currency: string;
  projectId: string;
}) {
  return sendEmail('project_completed', params);
}
