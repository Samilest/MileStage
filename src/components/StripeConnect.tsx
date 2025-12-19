// src/components/StripeConnect.tsx
// Updated with black styling for better visual hierarchy

import { useState, useEffect } from 'react';
import { CreditCard, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface StripeConnectProps {
  userId: string;
}

export default function StripeConnect({ userId }: StripeConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('stripe_account_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setIsConnected(!!data?.stripe_account_id);
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    toast.loading('Connecting to Stripe...');

    try {
      // Call API to create Stripe Connect account
      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Stripe');
      }

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Stripe connection error:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to connect Stripe');
      setConnecting(false);
    }
  };

  if (loading) return null;
  if (isConnected) return null; // Hide when connected

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        {/* Icon - Changed to black */}
        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-gray-900" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect Stripe to Get Paid
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Connect your Stripe account to accept credit card payments from clients. Setup takes 2 minutes.
          </p>

          {/* Benefits */}
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
              Accept credit cards, Apple Pay, Google Pay
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
              Automatic payouts to your bank account
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
              Secure payment processing by Stripe
            </li>
          </ul>

          {/* Button - Changed to black */}
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            {connecting ? 'Connecting...' : 'Connect Stripe'}
          </button>

          <p className="text-xs text-gray-500 mt-3">
            You'll be redirected to Stripe to complete a secure onboarding process.
          </p>
        </div>
      </div>
    </div>
  );
}
