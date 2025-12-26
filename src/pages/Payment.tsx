import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, CheckCircle2, Loader2, CreditCard, Wallet, Info } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import logo from '../assets/milestage-logo.png';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function StripePaymentForm({ 
  clientSecret, 
  shareCode, 
  stageId, 
  onSuccess 
}: { 
  clientSecret: string; 
  shareCode: string;
  stageId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client/${shareCode}?stage=${stageId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[Payment] Payment succeeded, confirming with server...');
        
        try {
          const response = await fetch('/api/stripe/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              stageId: stageId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to confirm payment');
          }

          console.log('[Payment] Payment confirmed! Redirecting...');
          window.location.href = `/payment-success?share=${shareCode}&stage=${stageId}`;
        } catch (confirmError) {
          console.error('[Payment] Confirmation error:', confirmError);
          window.location.href = `/payment-success?share=${shareCode}&stage=${stageId}`;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Complete Payment
          </>
        )}
      </button>

      <div className="text-center text-sm text-gray-500">
        <p>Powered by Stripe • Secure payment processing</p>
      </div>
    </form>
  );
}

function OfflinePaymentInstructions({ 
  paymentMethods, 
  amount, 
  currency, 
  onClose 
}: { 
  paymentMethods: any; 
  amount: number; 
  currency: string;
  onClose: () => void;
}) {
  const offlineInstructions = paymentMethods?.offline_instructions;

  if (!offlineInstructions || offlineInstructions.trim() === '') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No offline payment methods configured.</p>
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          Try card payment instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Payment Details</h3>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Send payment to:</p>
          <div className="text-base text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
            {offlineInstructions}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-green-900">Amount to send:</span>{' '}
            <span className="text-2xl font-bold text-green-600">{formatCurrency(amount, currency)}</span>
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-3">📌 Next Steps:</p>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Send <span className="font-semibold">{formatCurrency(amount, currency)}</span> using the payment details above</li>
          <li>Your freelancer will confirm receipt</li>
          <li>The next stage unlocks automatically</li>
        </ol>
        <p className="text-xs text-blue-700 mt-3 italic">
          No further action needed in MileStage!
        </p>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
      >
        Back to Payment Options
      </button>
    </div>
  );
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'offline' | null>(null);

  const stageId = searchParams.get('stage');
  const shareCode = searchParams.get('share');

  useEffect(() => {
    const storedPayment = sessionStorage.getItem('pendingPayment');
    
    if (!storedPayment || !stageId || !shareCode) {
      navigate(`/project/${shareCode}`);
      return;
    }

    try {
      const payment = JSON.parse(storedPayment);
      setPaymentInfo(payment);
      
      // Auto-select payment method if only one is available
      const hasStripe = !!payment.clientSecret;
      const hasOffline = payment.paymentMethods?.offline_instructions && payment.paymentMethods.offline_instructions.trim() !== '';
      
      if (hasStripe && !hasOffline) {
        // Only Stripe available - auto-select it
        setPaymentMethod('stripe');
      } else if (!hasStripe && hasOffline) {
        // Only offline available - auto-select it
        setPaymentMethod('offline');
      }
      // If both available, let user choose (paymentMethod stays null)
      
    } catch (err) {
      console.error('Error parsing payment info:', err);
      navigate(`/project/${shareCode}`);
    } finally {
      setLoading(false);
    }
  }, [stageId, shareCode, navigate]);

  const handleSuccess = () => {
    sessionStorage.removeItem('pendingPayment');
    navigate(`/payment-success?stage=${stageId}&share=${shareCode}`);
  };

  // Check what payment methods are available
  const hasStripe = paymentInfo?.clientSecret;
  const hasOffline = paymentInfo?.paymentMethods?.offline_instructions && paymentInfo.paymentMethods.offline_instructions.trim() !== '';
  const hasBothMethods = hasStripe && hasOffline;

  const handleBack = () => {
    if (paymentMethod && hasBothMethods) {
      // If both methods available, go back to selection
      setPaymentMethod(null);
    } else {
      // Otherwise go back to project
      navigate(`/project/${shareCode}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
          <p className="text-gray-600">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Not Found</h1>
          <button
            onClick={() => navigate(`/project/${shareCode}`)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret: paymentInfo.clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#22c55e',
      },
    },
  };

  return (
    <div className="min-h-screen bg-secondary-bg">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logo} alt="MileStage" className="h-12" />
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {paymentMethod && hasBothMethods ? 'Back' : 'Back to Project'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {!paymentMethod && hasBothMethods ? 'Choose Payment Method' : 'Complete Payment'}
            </h1>
            <p className="text-gray-600 mb-4">{paymentInfo.stageName}</p>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(paymentInfo.amount, paymentInfo.currency || 'USD')}
            </div>
          </div>

          <div className="p-6">
            {/* Show selection only if both methods available AND none selected yet */}
            {!paymentMethod && hasBothMethods ? (
              <div className="space-y-4">
                {/* Pay with Card */}
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className="w-full bg-white border-2 border-gray-200 hover:border-green-500 rounded-xl p-6 text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 group-hover:bg-green-500 p-3 rounded-lg transition-colors">
                      <CreditCard className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        Pay with Card
                      </h3>
                      <p className="text-sm text-gray-600">
                        Instant payment • Secure processing by Stripe
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Instant</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Secure</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Pay Offline */}
                <button
                  onClick={() => setPaymentMethod('offline')}
                  className="w-full bg-white border-2 border-gray-200 hover:border-green-500 rounded-xl p-6 text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 group-hover:bg-green-500 p-3 rounded-lg transition-colors">
                      <Wallet className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        Pay Offline
                      </h3>
                      <p className="text-sm text-gray-600">
                        PayPal, Venmo, Bank Transfer, or Other
                      </p>
                      <div className="mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Manual confirmation</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ) : paymentMethod === 'stripe' && hasStripe ? (
              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripePaymentForm 
                  clientSecret={paymentInfo.clientSecret} 
                  shareCode={shareCode!}
                  stageId={stageId!}
                  onSuccess={handleSuccess} 
                />
              </Elements>
            ) : paymentMethod === 'offline' && hasOffline ? (
              <OfflinePaymentInstructions
                paymentMethods={paymentInfo.paymentMethods || {}}
                amount={paymentInfo.amount}
                currency={paymentInfo.currency || 'USD'}
                onClose={() => hasBothMethods ? setPaymentMethod(null) : navigate(`/project/${shareCode}`)}
              />
            ) : (
              // Fallback - no payment methods available
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No payment methods available</p>
                <p className="text-sm text-gray-500 mb-4">Please contact the freelancer for payment details.</p>
                <button
                  onClick={() => navigate(`/project/${shareCode}`)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Back to Project
                </button>
              </div>
            )}
          </div>
        </div>

        {!paymentMethod && hasBothMethods && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p className="mt-2">MileStage never stores your card details</p>
          </div>
        )}
      </div>
    </div>
  );
}
