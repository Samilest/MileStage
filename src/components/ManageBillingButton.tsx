// src/components/ManageBillingButton.tsx
// Button to open Stripe Customer Portal

import { useState } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

interface ManageBillingButtonProps {
  label?: string;
  className?: string;
}

export default function ManageBillingButton({ 
  label = 'Manage Billing',
  className = ''
}: ManageBillingButtonProps) {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    if (!user?.id) {
      toast.error('Please sign in to manage billing');
      return;
    }

    setLoading(true);

    try {
      // Create portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }

    } catch (error) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleManageBilling}
      disabled={loading}
      className={className || 'bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
    >
      {loading ? 'Loading...' : label}
    </button>
  );
}
