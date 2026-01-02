import { X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { notifyExtensionPurchased } from '../lib/email';

interface ExtensionPurchaseModalProps {
  stageId: string;
  stageName: string;
  extensionPrice: number;
  projectId?: string;
  currency?: string;
  paymentMethods: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
  manualPaymentInstructions?: string | null;
  onClose: () => void;
}

export default function ExtensionPurchaseModal({
  stageId,
  stageName,
  extensionPrice,
  projectId,
  currency = 'USD',
  paymentMethods,
  manualPaymentInstructions,
  onClose,
}: ExtensionPurchaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingStripePayment, setCreatingStripePayment] = useState(false);
  const [referenceCode] = useState(() => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `EXT-${stageId.slice(0, 8).toUpperCase()}-${timestamp}`;
  });

  const handleMarkExtensionPaid = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('extensions').insert({
        stage_id: stageId,
        amount: extensionPrice,
        reference_code: referenceCode,
        status: 'marked_paid',
        marked_paid_at: new Date().toISOString(),
        additional_revisions: 1,
      });

      if (error) throw error;

      // Send email notification to freelancer
      try {
        console.log('[Extension Purchase] Sending notification email to freelancer...');
        console.log('[Extension Purchase] projectId:', projectId);
        
        if (projectId) {
          // Fetch project details
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('project_name, client_name, user_id')
            .eq('id', projectId)
            .single();
          
          console.log('[Extension Purchase] projectData:', projectData);
          console.log('[Extension Purchase] projectError:', projectError);
          
          if (projectData && projectData.user_id) {
            // Fetch freelancer email separately
            const { data: freelancerData, error: freelancerError } = await supabase
              .from('user_profiles')
              .select('email, name')
              .eq('id', projectData.user_id)
              .single();
            
            console.log('[Extension Purchase] freelancerData:', freelancerData);
            console.log('[Extension Purchase] freelancerError:', freelancerError);
            
            if (freelancerData && freelancerData.email) {
              await notifyExtensionPurchased({
                freelancerEmail: freelancerData.email,
                freelancerName: freelancerData.name || 'there',
                projectName: projectData.project_name,
                stageName: stageName,
                amount: extensionPrice.toString(),
                currency: currency,
                clientName: projectData.client_name || 'Your client',
                referenceCode: referenceCode,
              });
              
              console.log('[Extension Purchase] ✅ Email sent to freelancer');
            } else {
              console.log('[Extension Purchase] No freelancer email found');
            }
          } else {
            console.log('[Extension Purchase] No project data or user_id found');
          }
        } else {
          console.log('[Extension Purchase] No projectId available for email');
        }
      } catch (emailError: any) {
        console.error('[Extension Purchase] Email sending failed (non-critical):', emailError.message);
        // Don't throw - extension marking still succeeds even if email fails
      }

      alert('Extra revision payment marked! Waiting for freelancer to verify.');
      window.location.reload();
    } catch (error: any) {
      console.error('Error marking extension payment:', error);
      alert('Failed to mark payment: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = async () => {
    setCreatingStripePayment(true);
    try {
      // Create Stripe payment intent for extension
      const response = await fetch('/api/stripe/create-extension-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageId: stageId,
          amount: extensionPrice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.paymentUrl) {
        // Redirect to Stripe payment page
        window.location.href = result.paymentUrl;
      }
    } catch (error: any) {
      console.error('Error creating Stripe payment:', error);
      alert(`Failed to create payment: ${error.message || 'Please try again'}`);
    } finally {
      setCreatingStripePayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Buy Extra Revision - ${extensionPrice}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Purchase <strong>one additional revision</strong> for <strong>{stageName}</strong> beyond what's included in the stage.
          </p>

          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h3 className="font-bold text-lg text-blue-900 mb-3">Payment Instructions:</h3>
            <p className="text-sm text-blue-800 mb-4">
              Pay <strong>${extensionPrice}</strong> to the freelancer using one of these methods:
            </p>

            <div className="space-y-3">
              {manualPaymentInstructions ? (
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-gray-900 mb-2">Payment Details:</p>
                  <p className="text-sm text-gray-900 whitespace-pre-line">{manualPaymentInstructions}</p>
                </div>
              ) : paymentMethods && (paymentMethods.paypal || paymentMethods.venmo || paymentMethods.bank_transfer || paymentMethods.other) ? (
                <>
                  {paymentMethods.paypal && (
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="font-semibold text-gray-900">PayPal</p>
                      <p className="text-sm text-gray-900 font-mono mt-1">{paymentMethods.paypal}</p>
                    </div>
                  )}
                  {paymentMethods.venmo && (
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="font-semibold text-gray-900">Venmo</p>
                      <p className="text-sm text-gray-900 font-mono mt-1">{paymentMethods.venmo}</p>
                    </div>
                  )}
                  {paymentMethods.bank_transfer && (
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="font-semibold text-gray-900">Bank Transfer</p>
                      <p className="text-sm text-gray-900 whitespace-pre-line mt-1">{paymentMethods.bank_transfer}</p>
                    </div>
                  )}
                  {paymentMethods.other && (
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="font-semibold text-gray-900">Other</p>
                      <p className="text-sm text-gray-900 whitespace-pre-line mt-1">{paymentMethods.other}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">Contact freelancer for payment details</p>
                </div>
              )}
            </div>

            <div className="mt-4 bg-white p-4 rounded-lg border-2 border-blue-400">
              <p className="text-sm text-gray-700 mb-1">
                <strong>Reference Code:</strong>
              </p>
              <p className="text-xl font-bold text-blue-900">{referenceCode}</p>
              <p className="text-xs text-gray-500 mt-1">Include this code with your payment</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> MileStage does not process payments. You pay the freelancer directly using their preferred method. After paying, mark the payment below to notify the freelancer.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleStripePayment}
            disabled={creatingStripePayment || isSubmitting}
            className="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creatingStripePayment ? (
              'Creating Payment...'
            ) : (
              <>
                💳 Pay ${extensionPrice} with Card
              </>
            )}
          </button>
          
          <button
            onClick={handleMarkExtensionPaid}
            disabled={isSubmitting || creatingStripePayment}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : "Pay Offline Instead"}
          </button>
          
          <button
            onClick={onClose}
            disabled={isSubmitting || creatingStripePayment}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
