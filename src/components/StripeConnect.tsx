import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface StripeConnectProps {
  userId: string;
  onConnected?: () => void;
}

interface StripeStatusData {
  connected: boolean;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
}

export default function StripeConnect({ userId, onConnected }: StripeConnectProps) {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatusData>({
    connected: false,
    onboardingCompleted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
  });

  // Memoized fetch function that returns the status data
  const checkStripeStatus = useCallback(async (): Promise<StripeStatusData | null> => {
    if (!userId) return null;
    
    try {
      console.log('[StripeConnect] Fetching Stripe status for user:', userId);
      
      // Force fresh data by adding a cache-busting timestamp
      const { data, error } = await supabase
        .from('user_profiles')
        .select('stripe_account_id, stripe_connected_at, stripe_onboarding_completed, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('id', userId)
        .single();

      if (error) throw error;

      console.log('[StripeConnect] Raw data from DB:', {
        stripe_account_id: data?.stripe_account_id,
        stripe_onboarding_completed: data?.stripe_onboarding_completed,
        stripe_charges_enabled: data?.stripe_charges_enabled,
        stripe_payouts_enabled: data?.stripe_payouts_enabled,
      });

      // Explicitly convert to boolean to handle string/null/boolean edge cases
      // Database might return 'true' (string) or true (boolean) depending on how data was inserted
      const toBoolean = (value: any): boolean => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true';
        return !!value;
      };
      
      const newStatus: StripeStatusData = {
        connected: !!data?.stripe_account_id,
        onboardingCompleted: toBoolean(data?.stripe_onboarding_completed),
        chargesEnabled: toBoolean(data?.stripe_charges_enabled),
        payoutsEnabled: toBoolean(data?.stripe_payouts_enabled),
        accountId: data?.stripe_account_id || undefined,
      };

      console.log('[StripeConnect] Computed status:', newStatus);
      
      setStripeStatus(newStatus);
      return newStatus;
    } catch (error) {
      console.error('[StripeConnect] Error checking Stripe status:', error);
      toast.error('Failed to load payment status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId) {
      checkStripeStatus();
    }
  }, [userId, checkStripeStatus]);

  // Handle return from Stripe onboarding - check URL params and clean up
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeReturn = urlParams.get('stripe_return') === 'true';
    
    if (isStripeReturn && userId) {
      console.log('[StripeConnect] Detected return from Stripe onboarding');
      
      // Clean up URL parameters to prevent re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('stripe_return');
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.pathname + (newUrl.search || ''));
      
      // Fetch fresh status and show toast based on NEW data (not stale closure)
      const handleReturn = async () => {
        const freshStatus = await checkStripeStatus();
        
        if (freshStatus) {
          console.log('[StripeConnect] Fresh status after return:', freshStatus);
          
          if (freshStatus.onboardingCompleted && freshStatus.chargesEnabled && freshStatus.payoutsEnabled) {
            toast.success('Stripe connected successfully!');
            onConnected?.();
          } else if (freshStatus.connected && !freshStatus.onboardingCompleted) {
            // Account exists but onboarding not complete - webhook might not have fired yet
            // Wait a moment and try again
            console.log('[StripeConnect] Onboarding incomplete, retrying in 2 seconds...');
            setTimeout(async () => {
              const retryStatus = await checkStripeStatus();
              if (retryStatus?.onboardingCompleted && retryStatus?.chargesEnabled && retryStatus?.payoutsEnabled) {
                toast.success('Stripe connected successfully!');
                onConnected?.();
              }
            }, 2000);
          }
        }
      };
      
      handleReturn();
    }
  }, [userId, checkStripeStatus, onConnected]);

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      // Call your backend API to create Stripe Connect account
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe account');
      }

      const { accountLink } = await response.json();

      // Redirect to Stripe onboarding
      window.location.href = accountLink;
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to connect Stripe. Please try again.');
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  // Determine which banner to show based on Stripe status
  // Priority order: Green (success) > Orange (incomplete) > White (not started)
  
  const isFullyFunctional = stripeStatus.chargesEnabled || stripeStatus.onboardingCompleted;
  
  console.log('[StripeConnect] Render decision:', {
    connected: stripeStatus.connected,
    onboardingCompleted: stripeStatus.onboardingCompleted,
    chargesEnabled: stripeStatus.chargesEnabled,
    payoutsEnabled: stripeStatus.payoutsEnabled,
    isFullyFunctional,
  });

  // GREEN BANNER: Show if any of these success conditions are met:
  // - chargesEnabled is true (can accept payments)
  // - onboardingCompleted is true (webhook confirmed setup complete)
  // Both require having a connected account
  if (stripeStatus.connected && isFullyFunctional) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Stripe Connected</h3>
            <p className="text-sm text-green-800 mt-1">
              Your payment account is active. You can now receive payments from clients.
            </p>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 mt-2 font-medium"
            >
              View Stripe Dashboard <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ORANGE BANNER: Has account but not fully set up
  // Show only if connected but neither chargesEnabled nor onboardingCompleted
  if (stripeStatus.connected && !isFullyFunctional) {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Complete Stripe Setup</h3>
            <p className="text-sm text-orange-800 mt-1">
              You started connecting Stripe but didn't finish. Complete the setup to receive payments.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={connecting}
              className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected yet
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="bg-gray-100 p-3 rounded-lg">
          <CreditCard className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">Connect Stripe to Get Paid</h3>
          <p className="text-gray-600 text-sm mb-4">
            Connect your Stripe account to accept credit card payments from clients. 
            Setup takes 2 minutes.
          </p>
          
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-gray-900" />
              <span>Accept credit cards, Apple Pay, Google Pay</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-gray-900" />
              <span>Automatic payouts to your bank account</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-gray-900" />
              <span>Secure payment processing by Stripe</span>
            </div>
          </div>

          <button
            onClick={handleConnectStripe}
            disabled={connecting}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Connect Stripe
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-3">
            You'll be redirected to Stripe to complete a secure onboarding process.
          </p>
        </div>
      </div>
    </div>
  );
}
