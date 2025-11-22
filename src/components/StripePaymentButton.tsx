import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency, type CurrencyCode } from '../lib/currency';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentButtonProps {
  stageId: string;
  stageName: string;
  stageNumber: number;
  amount: number;
  currency: CurrencyCode;
  shareCode: string;
  onSuccess?: () => void;
}

function PaymentForm({ stageId, amount, currency, shareCode, onSuccess }: Omit<StripePaymentButtonProps, 'stageName' | 'stageNumber'>) {
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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client/${shareCode}?payment_success=true`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
      } else {
        // Payment succeeded, webhook will handle the rest
        onSuccess?.();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay {formatCurrency(amount, currency)}
          </>
        )}
      </button>
    </form>
  );
}

export default function StripePaymentButton({
  stageId,
  stageName,
  stageNumber,
  amount,
  currency,
  shareCode,
  onSuccess,
}: StripePaymentButtonProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayNowClick = async () => {
    setLoading(true);
    setError('');

    try {
      // Call API to create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageId,
          shareCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initialize payment');
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
      setShowPaymentForm(true);
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={handlePayNowClick}
          className="mt-3 text-red-700 font-semibold text-sm hover:text-red-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!showPaymentForm) {
    return (
      <button
        onClick={handlePayNowClick}
        disabled={loading}
        className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay Now - {formatCurrency(amount, currency)}
          </>
        )}
      </button>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#10b981',
      },
    },
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-100 p-2 rounded">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold">Complete Payment</h3>
          <p className="text-sm text-gray-600">Stage {stageNumber}: {stageName}</p>
        </div>
      </div>

      <Elements stripe={stripePromise} options={options}>
        <PaymentForm
          stageId={stageId}
          amount={amount}
          currency={currency}
          shareCode={shareCode}
          onSuccess={onSuccess}
        />
      </Elements>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Secured by Stripe · Your payment information is encrypted
      </p>
    </div>
  );
}
