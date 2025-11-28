import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import logo from '../assets/milestage-logo.png';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const shareCode = searchParams.get('share');
  const stageId = searchParams.get('stage');

  useEffect(() => {
    // Clear any stored payment info
    sessionStorage.removeItem('pendingPayment');

    // Confirm payment with backend
    const paymentIntentId = searchParams.get('payment_intent');
    
    if (stageId && paymentIntentId) {
      console.log('[PaymentSuccess] Confirming payment:', { paymentIntentId, stageId });
      
      fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, stageId }),
      })
        .then(res => res.json())
        .then(data => console.log('[PaymentSuccess] Payment confirmed:', data))
        .catch(err => console.error('[PaymentSuccess] Confirmation error:', err));
    }
  }, [searchParams, stageId]);

  return (
    <div className="min-h-screen bg-secondary-bg">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <img src={logo} alt="MileStage" className="h-12" />
          </div>
        </div>
      </nav>

      {/* Success Message */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden text-center p-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your payment has been processed successfully. The freelancer will be notified and can now start working on the next stage.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <p className="text-sm text-gray-700 mb-2">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
              <li>✓ Your payment has been confirmed</li>
              <li>✓ The freelancer has been notified</li>
              <li>✓ You can track progress in the project portal</li>
              <li>✓ You'll receive updates via email</li>
            </ul>
          </div>

          {shareCode && (
            <Link
              to={`/project/${shareCode}`}
              className="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg"
            >
              Back to Project
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:support@milestage.com" className="text-green-600 hover:underline">
                support@milestage.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
