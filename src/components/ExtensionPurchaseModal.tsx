import { X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ExtensionPurchaseModalProps {
  stageId: string;
  stageName: string;
  extensionPrice: number;
  paymentMethods: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
  onClose: () => void;
}

export default function ExtensionPurchaseModal({
  stageId,
  stageName,
  extensionPrice,
  paymentMethods,
  onClose,
}: ExtensionPurchaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const referenceCode = `EXT-${stageId.slice(0, 8).toUpperCase()}`;

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

      alert('Extra revision payment marked! Waiting for freelancer to verify.');
      window.location.reload();
    } catch (error: any) {
      console.error('Error marking extension payment:', error);
      alert('Failed to mark payment: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
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
              {paymentMethods && (paymentMethods.paypal || paymentMethods.venmo || paymentMethods.bank_transfer || paymentMethods.other) ? (
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
          <p className="text-sm text-gray-600">
            After paying the freelancer, click below to notify them:
          </p>
          <button
            onClick={handleMarkExtensionPaid}
            disabled={isSubmitting}
            className="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : "✅ I've Paid - Mark Extra Revision Payment Sent"}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
