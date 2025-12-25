import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

interface SubscriptionStatus {
  canCreateProjects: boolean;
  isTrialExpired: boolean;
  daysRemaining: number | null;
  status: string;
}

export function useSubscription() {
  const user = useStore((state) => state.user);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    canCreateProjects: true,
    isTrialExpired: false,
    daysRemaining: null,
    status: 'trialing',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function checkSubscription() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Subscription check error:', error);
          setLoading(false);
          return;
        }

        const now = new Date();
        const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        
        // Calculate if trial is expired
        const isExpired = trialEndsAt ? now > trialEndsAt : false;
        
        // Calculate days remaining
        let daysRemaining = null;
        if (trialEndsAt) {
          const diffTime = trialEndsAt.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // User can create projects if:
        // 1. Subscription is active (paid), OR
        // 2. Trial is not expired yet
        const canCreate = data.subscription_status === 'active' || !isExpired;

        setSubscription({
          canCreateProjects: canCreate,
          isTrialExpired: isExpired,
          daysRemaining,
          status: data.subscription_status,
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [user?.id]);

  return { subscription, loading };
}
