import React from 'react';
import { X, CreditCard, DollarSign } from 'lucide-react';

interface PaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectStripe: () => void;
  onSetupManual: () => void;
}

export default function PaymentSetupModal({ 
  isOpen, 
  onClose, 
  onConnectStripe,
  onSetupManual 
}: PaymentSetupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-yellow-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          Payment Setup Required
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          Before sharing the portal with your client, set up how you'll receive payments.
        </p>

        {/* Option 1: Stripe */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onConnectStripe}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Connect Stripe</div>
                <div className="text-sm text-green-100">Automated online payments</div>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </button>

          {/* Option 2: Manual */}
          <button
            onClick={onSetupManual}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Manual Payment Info</div>
                <div className="text-sm text-gray-600">Bank transfer, PayPal, etc.</div>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full text-gray-600 hover:text-gray-900 font-medium py-2"
        >
          Cancel
        </button>

        {/* Info note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can change your payment method anytime in settings
        </p>
      </div>
    </div>
  );
}
