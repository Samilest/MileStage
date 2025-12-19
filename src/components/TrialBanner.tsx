// src/components/TrialBanner.tsx
// Shows trial status and upgrade prompt

import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function TrialBanner() {
  const user = useStore((state) => state.user);
  const [trialInfo, setTrialInfo] = useState<{
    status: string;
    daysLeft: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchTrialStatus = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (error || !data) return;

      // Calculate days left
      const trialEnd = new Date(data.trial_ends_at);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysLeft <= 0;

      setTrialInfo({
        status: data.subscription_status,
        daysLeft: Math.max(0, daysLeft),
        isExpired,
      });
    };

    fetchTrialStatus();
  }, [user?.id]);

  if (!trialInfo) return null;

  // Don't show if already active subscriber
  if (trialInfo.status === 'active') return null;

  // Trial expired
  if (trialInfo.isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Trial Ended
            </h3>
            <p className="text-red-700 mb-4">
              Your 14-day trial has ended. Upgrade to continue using MileStage.
            </p>
            <button
              onClick={() => window.location.href = '/#pricing'}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Upgrade to Pro ($19/month)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial ending soon (3 days or less)
  if (trialInfo.daysLeft <= 3) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6 rounded-lg">
        <div className="flex items-start gap-4">
          <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Trial Ends in {trialInfo.daysLeft} {trialInfo.daysLeft === 1 ? 'Day' : 'Days'}
            </h3>
            <p className="text-yellow-700 mb-4">
              Upgrade now to continue using MileStage without interruption.
            </p>
            <button
              onClick={() => window.location.href = '/#pricing'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Upgrade to Pro ($19/month)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial active (more than 3 days left) - minimal banner
  return (
    <div className="bg-green-50 border border-green-200 p-4 mb-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Trial: <strong>{trialInfo.daysLeft} days remaining</strong>
          </span>
        </div>
        <button
          onClick={() => window.location.href = '/#pricing'}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
