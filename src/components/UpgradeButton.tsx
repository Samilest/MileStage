// src/components/UpgradeButton.tsx
// Button to start subscription checkout

import { useState } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

interface UpgradeButtonProps {
  priceId: string; // Stripe price ID (monthly or annual)
  label?: string;
  className?: string;
}

export default function UpgradeButton({ 
  priceId, 
  label = 'Upgrade Now',
  className = ''
}: UpgradeButtonProps) {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Please sign in to upgrade');
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          priceId: priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={className || 'bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
    >
      {loading ? 'Loading...' : label}
    </button>
  );
}
