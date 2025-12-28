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
  } catch (error) {
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
