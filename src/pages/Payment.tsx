import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
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
          return_url: `${window.location.origin}/payment-success?share=${shareCode}&stage=${stageId}`,
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
          window.location.href = `/payment-success?share=${shareCode}&stage=${stageId}&payment_intent=${paymentIntent.id}`;
        } catch (confirmError) {
          console.error('[Payment] Confirmation error:', confirmError);
          window.location.href = `/payment-success?share=${shareCode}&stage=${stageId}&payment_intent=${paymentIntent.id}`;
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

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      
      // This page is for Stripe payments only - must have clientSecret
      if (!payment.clientSecret) {
        navigate(`/project/${shareCode}`);
        return;
      }
      
      setPaymentInfo(payment);
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
              onClick={() => navigate(`/project/${shareCode}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Payment
            </h1>
            <p className="text-gray-600 mb-4">{paymentInfo.stageName}</p>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(paymentInfo.amount, paymentInfo.currency || 'USD')}
            </div>
          </div>

          <div className="p-6">
            <Elements stripe={stripePromise} options={stripeOptions}>
              <StripePaymentForm 
                clientSecret={paymentInfo.clientSecret} 
                shareCode={shareCode!}
                stageId={stageId!}
                onSuccess={handleSuccess} 
              />
            </Elements>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted</p>
          <p className="mt-2">MileStage never stores your card details</p>
        </div>
      </div>
    </div>
  );
}
