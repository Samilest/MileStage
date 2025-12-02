import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
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

interface PaymentFormProps {
  stageId: string;
  amount: number;
  currency: CurrencyCode;
  shareCode: string;
  onSuccess?: () => void;
}

function PaymentForm({ stageId, amount, currency, shareCode, onSuccess }: PaymentFormProps) {
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
      console.log('[StripePaymentButton] Starting payment...');
      console.log('[StripePaymentButton] StageId:', stageId);
      console.log('[StripePaymentButton] ShareCode:', shareCode);

      // CRITICAL FIX: Store stageId in sessionStorage BEFORE payment
      // This ensures we can recover it even if Stripe strips URL params
      sessionStorage.setItem('pendingPaymentStageId', stageId);
      sessionStorage.setItem('pendingPaymentShareCode', shareCode);

      // CRITICAL FIX: Include stageId in the return URL
      const returnUrl = `${window.location.origin}/client/${shareCode}?stage=${stageId}`;
      console.log('[StripePaymentButton] Return URL:', returnUrl);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required', // Don't redirect if not needed (non-3DS cards)
      });

      if (error) {
        // Payment failed - clear stored data
        sessionStorage.removeItem('pendingPaymentStageId');
        sessionStorage.removeItem('pendingPaymentShareCode');
        setErrorMessage(error.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      // Payment succeeded without redirect (non-3DS card)
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[StripePaymentButton] Payment succeeded without redirect');
        console.log('[StripePaymentButton] PaymentIntent ID:', paymentIntent.id);

        // Confirm payment with server
        try {
          const response = await fetch('/api/stripe/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              stageId: stageId,
            }),
          });

          const data = await response.json();
          console.log('[StripePaymentButton] Server confirmation:', data);

          if (!response.ok) {
            console.error('[StripePaymentButton] Server error:', data);
          }
        } catch (confirmError) {
          console.error('[StripePaymentButton] Confirmation error:', confirmError);
          // Continue anyway - payment succeeded in Stripe
        }

        // Clear stored data
        sessionStorage.removeItem('pendingPaymentStageId');
        sessionStorage.removeItem('pendingPaymentShareCode');

        // Call success callback or reload
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to client portal with confirmation flag
          window.location.href = `/client/${shareCode}?payment_confirmed=true`;
        }
      }
      
      // If we get here without paymentIntent, Stripe is handling the redirect
      // The return_url will be used, and ClientPortal will handle confirmation
      
    } catch (err) {
      sessionStorage.removeItem('pendingPaymentStageId');
      sessionStorage.removeItem('pendingPaymentShareCode');
      setErrorMessage('An unexpected error occurred');
      console.error('[StripePaymentButton] Payment error:', err);
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
      console.log('[StripePaymentButton] Creating payment intent for stage:', stageId);

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
      console.log('[StripePaymentButton] Payment intent created');
      
      setClientSecret(secret);
      setShowPaymentForm(true);
    } catch (err: any) {
      console.error('[StripePaymentButton] Error creating payment intent:', err);
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
