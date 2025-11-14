import { CreditCard } from 'lucide-react';
import { useState } from 'react';

interface PaymentInfoBoxProps {
  paymentMethods: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
  freelancerName: string;
}

export default function PaymentInfoBox({ paymentMethods, freelancerName }: PaymentInfoBoxProps) {
  const [showPaymentHelp, setShowPaymentHelp] = useState(false);

  const hasAnyPaymentMethod =
    paymentMethods.paypal ||
    paymentMethods.venmo ||
    paymentMethods.bank_transfer ||
    paymentMethods.other;

  if (!hasAnyPaymentMethod) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
            Payment Information
          </h3>
          <p className="text-xs sm:text-sm text-gray-700">
            Pay {freelancerName} using any of these methods:
          </p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {paymentMethods.paypal && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white rounded-lg p-3 shadow-sm">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 sm:w-24 flex-shrink-0">
              PayPal:
            </span>
            <span className="text-xs sm:text-sm text-gray-900 font-mono break-all">
              {paymentMethods.paypal}
            </span>
          </div>
        )}

        {paymentMethods.venmo && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white rounded-lg p-3 shadow-sm">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 sm:w-24 flex-shrink-0">
              Venmo:
            </span>
            <span className="text-xs sm:text-sm text-gray-900 font-mono break-all">
              {paymentMethods.venmo}
            </span>
          </div>
        )}

        {paymentMethods.bank_transfer && (
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 bg-white rounded-lg p-3 shadow-sm">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 sm:w-24 flex-shrink-0">
              Bank Transfer:
            </span>
            <span className="text-xs sm:text-sm text-gray-900 whitespace-pre-line break-words">
              {paymentMethods.bank_transfer}
            </span>
          </div>
        )}

        {paymentMethods.other && (
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 bg-white rounded-lg p-3 shadow-sm">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 sm:w-24 flex-shrink-0">
              Other:
            </span>
            <span className="text-xs sm:text-sm text-gray-900 whitespace-pre-line break-words">
              {paymentMethods.other}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-blue-300">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <p className="text-xs sm:text-sm text-gray-800">
                <span className="font-semibold">Remember:</span> Include the payment reference code when paying.
              </p>
            </div>

            <button
              onClick={() => setShowPaymentHelp(!showPaymentHelp)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors flex-shrink-0"
            >
              {showPaymentHelp ? 'Hide' : 'Learn more'}
              <svg
                className={`w-3 h-3 transition-transform ${showPaymentHelp ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showPaymentHelp && (
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-400 animate-fade-in">
              <p className="text-xs sm:text-sm text-blue-900 mb-2 sm:mb-3 font-semibold">
                How payment references work:
              </p>
              <ol className="text-xs sm:text-sm text-blue-800 space-y-1 sm:space-y-2 list-decimal list-inside">
                <li>Each stage has a unique code (e.g., "STAGE1-ABC123")</li>
                <li>When you pay, include this code in the payment note/message</li>
                <li>{freelancerName} will verify your payment and unlock the next stage</li>
              </ol>
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Example:</span> When paying Stage 1,{' '}
                  {paymentMethods.paypal && (
                    <>
                      send to <span className="font-mono">{paymentMethods.paypal}</span> and{' '}
                    </>
                  )}
                  include "STAGE1-ABC123" in the payment note.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
